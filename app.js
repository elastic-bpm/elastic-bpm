var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var azure = require('./logic/azure.js');

get_virtualmachines = function (req, res) {
    vms = azure.get_vms();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(vms, null, 3));
};

get_status = function(req, res) {
    msg = azure.get_status();
    statusCode = 500;

    if (msg === 'done') {
        msg = 'ok';
        statusCode = 200;
    } else if (msg === 'login') {
        msg = azure.get_code();
        statusCode = 206;
    } 

    res.setHeader('Content-Type', 'application/json');
    res.status(Number(statusCode)).send(JSON.stringify(msg, null, 3));
};

stop_virtualmachine = function(req, res) {
    azure.stop_vm(req.params.resourcegroup, req.params.vm, (error) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify('ok', null, 3));
        }
    });
};

start_virtualmachine = function(req, res) {
    azure.start_vm(req.params.resourcegroup, req.params.vm, (error) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify('ok', null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/virtualmachines', get_virtualmachines);
    
    app.delete('/virtualmachines/:resourcegroup/:vm', stop_virtualmachine);
    app.post('/virtualmachines/:resourcegroup/:vm', start_virtualmachine);
    
    app.get('/status', get_status);
};

// Server startup
start_server = function() {
    app.listen(8888, function () {
        console.log('Elastic-scaling listening on port 8888!');
    });
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    azure.start_events();
}