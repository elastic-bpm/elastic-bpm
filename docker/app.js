/*jshint esversion: 6 */

var Docker = require('dockerode');
var docker_local = new Docker({socketPath: '/var/run/docker.sock'});
var docker_remote = new Docker({socketPath: '/var/run/docker.sock'});

// var docker_remote_host = process.env.DOCKER_HOST || "localhost";
// var docker_remote = new Docker({host: docker_remote_host, port: 4243});

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

const service_amount = 15;
var services = {};
for (var i = 1; i <= service_amount; i++) {
    var i_str = i < 10 ? "0" + i : i;
    services["elastic-workers-" + i_str] = "node"+i_str;
}

getServiceArray = function() {
    services_array = [];

    Object.keys(services).forEach(function(key, index) {
        services_array.push(key);
    }, services);

    return services_array;
};

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
update_nodes = function(callback) {
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
        
        if (callback) callback();
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

get_node_by_hostname = function(hostname) {
    node = undefined;

    Object.keys(nodes).forEach(function(key, index) {
        if (nodes[key].hostname == hostname) {
            node = nodes[key];
        }
    }, nodes);
    
    return node;
};

set_node = function(req, res) {
    var availability = req.params.availability;
    if (availability !== "active" && availability !== "drain") {
        send_error(res, "Unknown availability: " + availability);
        return;
    }

    var node = docker_remote.getNode(get_node_by_hostname(req.params.hostname).id);
    node.inspect((err,node_info) => {
        if (err) {
            console.log("Error: " + err);
            return;
        } else {
            // Update node with new availability
            update = {
                version: node_info.Version.Index,
                Availability: availability,
                Role: "worker",
            };

            node.update(update, (err, data) => {
                if (err) {
                    setTimeout(() => set_node(req, res), 500);
                    return;
                } else {
                    update_nodes(function () {
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(update, null, 3));    
                    });
                }
            });
        }
    });
};

var create_filter = function() {
    var services_array = getServiceArray();
    var filter = '{"name":[';
    
    services_array.forEach(function(element, index) {
        if (index < services_array.length - 1) {
            filter += '"' + element + '",';
        } else {
            filter += '"' + element + '"';
        }
    });

    filter += ']}';
    return filter;
};

get_workers = function(req, res) {
    docker_remote.listTasks({filters: create_filter()}, (err, data) => {
        if (err) {
            send_error(res, err);
        } else {
            data = data.map((task) => {
                if (task.Status.Err === undefined) {
                    task.Status.Err = "";
                } 
                if (nodes[task.NodeID] !== undefined) {
                    task.NodeID = nodes[task.NodeID].hostname || "unknown";
                } else {
                    task.NodeID = "none yet";
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

            services_array = getServiceArray();
            worker_service_info = data.filter((item) => services_array.indexOf(item.Spec.Name) > -1);
            if (worker_service_info === undefined) {

                send_error(res, "Service not found...?");
                return;

            } else {

                error = "";
                worker_service_info.forEach(function(info) {
                    update = info.Spec; 
                    update.version = info.Version.Index;
                    update.Mode = {
                        Replicated: {
                            Replicas: amount
                        }
                    };

                    worker_service = docker_remote.getService(info.ID);
                    worker_service.update(update, (err2, data2) => {if (err2) error += err;});
                });

                if (error) {
                    send_error(error);
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify("ok", null, 3));      
                }
            }

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

        services_array = getServiceArray();
        worker_service_info = data.filter((item) => services_array.indexOf(item.Spec.Name) > -1);
        if (worker_service_info === undefined) {

            send_error(res, "Worker service not found.");

        } else {

            error = "";
            worker_service_info.forEach(function(info) {
                worker_service = docker_remote.getService(info.ID);
                worker_service.remove((err2, data2) => {if (err2) error += err;});
            });

            if (error) {
                send_error(error);
            } else {
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify('ok', null, 3));      
            }
        }
    });
};

create_workers = function(req, res) {
    var scheduler_host = process.env.SCHEDULER_ENV_DOCKERCLOUD_CONTAINER_FQDN || "localhost";
    opts = {
      "Name": "elastic-workers-01",
      "TaskTemplate": {
        "ContainerSpec": {
          "Image": "djbnjack/elastic-worker",
          "Env": [
            "SCHEDULER=" + scheduler_host
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
        "Placement": {
            "Constraints": []
        },
        "LogDriver": {
            "Name": "gelf",
            "Options": {
                "gelf-address": "udp://137.116.195.67:12201"
            }
        }
      },
      "Mode": {
        "Replicated": {
          "Replicas": 4
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
    
    error = "";

    services_array = getServiceArray();
    services_array.forEach(function(service_name) {
        var n_opts = JSON.parse(JSON.stringify(opts));
        n_opts.Name = service_name;
        n_opts.TaskTemplate.Placement.Constraints.push('node.hostname == ' + services[service_name]);
        console.log(JSON.stringify(n_opts));
        docker_remote.createService(n_opts, (err, data) => {if (err) error += err;});
    });

    if (error) {
        send_error(res, error);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify("ok", null, 3));            
    }
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
    app.post('/node/:hostname/:availability', set_node);

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
