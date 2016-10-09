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
  res.send(JSON.stringify(code, null, 3));
};


// ROUTING
setup_routes = function() {
    app.get('/virtualmachines', get_virtualmachines);
    app.get('/code', get_code);
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
}

azure.start_events();

