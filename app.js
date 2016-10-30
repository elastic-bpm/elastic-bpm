/*jshint esversion: 6 */

var Docker = require('dockerode');
var docker_local = new Docker();

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

get_containers = function(req, res) {
    docker_local.listContainers(function (err, containers) {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(containers, null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/containers', get_containers); 
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
