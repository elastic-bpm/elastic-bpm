/*jshint esversion: 6 */

var Docker = require('dockerode');
var docker_local = new Docker();
var docker_remote = new Docker({host: 'http://master-01.westeurope.cloudapp.azure.com', port: 4243});

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

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

// TODO: Only get nodes when undefined node is found!!
get_nodes = function(callback) {
    nodes = {};
    docker_remote.listNodes((err, data) => {
        if (err) {
            res.status(500).send(err);
        } else {
            data.forEach((node) => {
                nodes[node.ID] = node.Description.Hostname;
            });

            callback(nodes);
        }
    });
};

// TODO: Only get nodes when undefined node is found!!
get_workers = function(req, res) {
    get_nodes((nodes) => {
        docker_remote.listTasks({filters:'{"service":["elastic-workers"]}'}, (err, data) => {
            if (err) {
                res.status(500).send(err);
            } else {
                data = data.map((task) => {
                    task.NodeID = nodes[task.NodeID];
                    return task;
                });

                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify(data, null, 3));            
            }
        });
    });
};

// ROUTING
setup_routes = function() {
    app.get('/info/local', get_info_local);
    app.get('/info/remote', get_info_remote);
    app.get('/containers/local', get_containers_local); 
    app.get('/containers/remote', get_containers_remote); 
    app.get('/services', get_services);
    app.get('/workers', get_workers);

    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    app.listen(4444, () => console.log('elastic-docker listening on port 4444!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}
