var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

var azure = require('./logic/azure.js');

get_virtualmachines = function (req, res) {
    vms = azure.get_vms();
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(vms, null, 3));
};

get_code = function(req, res) {
    code = azure.get_code();
    res.setHeader('Content-Type', 'text/html');
    res.send(code);
};

get_status = function(req, res) {
    msg = azure.get_status();
    statusCode = 500;

    if (msg === 'done') {
        msg = 'ok';
        statusCode = 200;
    } else if (msg === 'login') {
        code = azure.get_code();
        msg = code;
        statusCode = 206;
    } 

    res.setHeader('Content-Type', 'application/json');
    res.status(statusCode).send(JSON.stringify(msg, null, 3));
};

// ROUTING
setup_routes = function() {
    app.get('/virtualmachines', get_virtualmachines);
    app.get('/code', get_code);
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