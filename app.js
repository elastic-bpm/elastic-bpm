/*jshint esversion: 6 */

var util = require('util');
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);

var redis_listener = require('./components/redis-listener');
var elastic_api = require('./components/elastic-api');
var elastic_scaling = require('./components/elastic-scaling');
    
app.use(bodyParser.json());
app.use(express.static('public'));

var num_events = 0;
var events = [];
send_event = function (event) {
    num_events++;
    events.push(event);
    io.emit('event', event);
};

// Send new connections EVERYTHING... muhahaha
io.on('connect', (socket) => {
    events.forEach((event) => {
        socket.emit('event', event);
    });
});

redis_status = {
    name: "redis-listener",
    status: 0,
    message: "Not connected"
};

elastic_api_status = {
    name: "elastic-api",
    status: 0,
    message: "Not connected"
};

elastic_scaling_status = {
    name: "elastic-scaling",
    status: 0,
    message: "Not connected"
};

start_check_status = function() {
    redis_listener.connect_client(
        () => {
            redis_status.status = 500;
            redis_status.message = "Error connecting to Redis";
        },
        () => {
            redis_status.status = 200;
            redis_status.message = "Connected to Redis";
        } 
    );

    elastic_api.check_api_status(
        (err) => {
            elastic_api_status.status = 500;
            elastic_api_status.message = "" + err;
        },
        () => {
            elastic_api_status.status = 200;
            elastic_api_status.message = "Connected to elastic-api";
        }
    );

    elastic_scaling.check_scaling_status(
        (status_code, message) => {
            elastic_scaling_status.status = status_code;
            elastic_scaling_status.message = "" + message;
        },
        () => {
            elastic_scaling_status.status = 200;
            elastic_scaling_status.message = "Connected to elastic-scaling";
        }
    );
    // Check other components here
};

get_status = function(req, res) {
    status_data = [
        redis_status,
        elastic_api_status,
        elastic_scaling_status
    ];
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(status_data, null, 3));
};

get_virtualmachines = function(req, res) {
    elastic_scaling.get_vms((err, success) => {
        if (err) {
            // console.log("Got error from elastic_scaling.get_vms:");
            // console.dir(err);
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(success, null, 3));
        }
    });
};

get_workflows = function(req, res) {
    elastic_api.get_workflows((err, success) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(success, null, 3));
        }
    });
};

create_workflow = function(req, res) {
    elastic_api.create_workflow(req.body, (err, success) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(success, null, 3));
        }
    });
};

delete_workflow = function(req, res) {
    workflow_id = req.params.workflow_id;
    elastic_api.delete_workflow(workflow_id, (err, success) => {
        if (err) {
            res.status(500).send(err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(success, null, 3));
        }
    });
};

start_virtualmachine = function(req, res) {
    machine_id = req.params.machine_id;
    res.send("Starting " + machine_id);    
};

stop_virtualmachine = function(req, res) {
    machine_id = req.params.machine_id;
    res.send("Stopping " + machine_id);    
};


// ROUTING
setup_routes = function() {
   app.get('/status', get_status);

   app.get('/workflows', get_workflows);
   app.post('/workflows', create_workflow);
   app.delete('/workflows/:workflow_id', delete_workflow);

   app.get('/virtualmachines', get_virtualmachines);
   app.post('/virtualmachines/:machine_id/start', start_virtualmachine);
   app.post('/virtualmachines/:machine_id/stop', stop_virtualmachine);
};

// Emit events
start_casting = function () {
    redis_listener.register_events(send_event);
};

// Server startup
start_server = function() {
    server.listen(8080, () => console.log('Elastic-dashboard listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_check_status();
    start_casting();
}
