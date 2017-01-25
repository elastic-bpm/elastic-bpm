/*jshint esversion: 6 */

var Docker = require('dockerode');
var docker_local = new Docker();
var docker_remote = new Docker({host: 'http://master-01.westeurope.cloudapp.azure.com', port: 4243});

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

const os = require('os');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": "137.116.195.67",
            "port": 12201,
            "type": "gelf",
            "hostname": "elastic-docker@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

get_containers_local = function(req, res) {
    get_containers(req, res, docker_local);
};

get_containers_remote = function(req, res) {
    get_containers(req, res, docker_remote);
};

get_containers = function(req, res, docker) {
    docker.listContainers((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));
        }
    });
};

get_info = function(req, res, docker) {
    docker.info((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));            
        }
    });
};

get_info_local = function(req, res) {
    get_info(req, res, docker_local);
};

get_info_remote = function(req, res) {
    get_info(req, res, docker_remote);
};

get_services = function(req, res) {
    docker_remote.listServices((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));            
        }
    });
};

nodes = {};
update_nodes = function() {
    docker_remote.listNodes((err, data) => {
        if (err) {
            console.log("Error: " + err);
        } else {
            data.forEach((node) => {
                if (node.Spec.Role !== "manager") {
                    nodes[node.ID] = {
                        id: node.ID,
                        hostname: node.Description.Hostname,
                        availability: node.Spec.Availability,
                        status: node.Status.State
                    };
                    //console.log(nodes[node.ID]);
                }
            });
        }
    });
};

get_nodes = function(req, res) {
    node_arr = [];

    Object.keys(nodes).forEach(function(key, index) {
       node_arr.push(nodes[key]);
    }, nodes);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(node_arr, null, 3));                
};

set_node = function(req, res) {
    var availability = req.params.availability;
    if (availability !== "active" && availability !== "drain") {
        console.log("Unknown availability: " + availability);
        res.status(500).send("Unknown availability: " + availability);
        return;
    }

    var node = docker_remote.getNode(nodes[req.params.name].id);
    node.inspect((err,node_info) => {
        // Update node with new availability
        update = {
            version: node_info.Version.Index,
            Availability: availability,
            Role: "worker",
        };

        node.update(update, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(update, null, 3));    
            }
        });

    });
};

get_workers = function(req, res) {
    docker_remote.listTasks({filters:'{"service":["elastic-workers"]}'}, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            data = data.map((task) => {
                if (task.Status.Err === undefined) {
                    task.Status.Err = "";
                } 
                if (nodes[task.NodeID] !== undefined) {
                    task.NodeID = nodes[task.NodeID].hostname || "unknown";
                }
                return task;
            });

            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));            
        }
    });
};

send_error = function(res, error) {
    console.log(error);
    res.status(500).send(error);
};

update_workers = function(req, res) {
    amount = parseInt(req.body.scale);
    if (amount !== undefined) {
        docker_remote.listServices((err, data) => {
            if (data === null) {
                send_error(res, "No services running");
                return;
            }

            worker_service_info = data.filter((item) => item.Spec.Name === "elastic-workers")[0];

            update = worker_service_info.Spec; 
            update.version = worker_service_info.Version.Index;
            update.Mode = {
                Replicated: {
                    Replicas: amount
                }
            };

            worker_service = docker_remote.getService(worker_service_info.ID);
            worker_service.update(update, (err2, data2) => {
                if (err2) {
                    send_error(res, "" + err2);
                } else {
                    console.log(data2);
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data2, null, 3));      
                }
            });

        });
    } else {
        res.status(500).send("No scale info in body: " + req.body);
    }
};

delete_workers = function(req, res) {
    docker_remote.listServices((err, data) => {
        if (data === null) {
            send_error(res, "No services running");
            return;
        }

        worker_service_info = data.filter((item) => item.Spec.Name === "elastic-workers")[0];

        if (worker_service_info === undefined) {

            send_error(res, "Worker service not found.");

        } else {

            worker_service = docker_remote.getService(worker_service_info.ID);
            worker_service.remove((err2, data2) => {
                if (err2) {
                    send_error(res, "" + err2);
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify('ok', null, 3));      
                }
            });
        }
    });
};

create_workers = function(req, res) {
    opts = {
      "Name": "elastic-workers",
      "TaskTemplate": {
        "ContainerSpec": {
          "Image": "djbnjack/elastic-worker",
          "Env": [
            "SCHEDULER=" + process.env.SCHEDULER_ENV_DOCKERCLOUD_CONTAINER_FQDN || "localhost"
          ]
        },
        "Resources": {
          "Limits": {},
          "Reservations": {}
        },
        "RestartPolicy": {
          "Condition": "any",
          "MaxAttempts": 0
        },
        "Placement": {},
        "LogDriver": {
            "Name": "gelf",
            "Options": {
                "gelf-address": "udp://137.116.195.67:12201"
            }
        }
      },
      "Mode": {
        "Replicated": {
          "Replicas": 0
        }
      },
      "UpdateConfig": {
        "Parallelism": 1,
        "FailureAction": "pause"
      },
      "EndpointSpec": {
        "Mode": "vip"
      }
    };
    
    docker_remote.createService(opts, (err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));            
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/info/local', get_info_local);
    app.get('/info/remote', get_info_remote);
    app.get('/containers/local', get_containers_local); 
    app.get('/containers/remote', get_containers_remote); 
    
    app.get('/services', get_services);
    app.put('/services/workers', update_workers);
    app.delete('/services/workers', delete_workers);
    app.post('/services/workers', create_workers);

    app.get('/workers', get_workers);

    app.get('/nodes', get_nodes);
    app.post('/node/:name/:availability', set_node);

    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    update_nodes();
    setInterval(update_nodes, 5000); // 5 secs
    app.listen(4444, () => console.log('elastic-docker listening on port 4444!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}
