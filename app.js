var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var workflows = require('./repository/workflows');

// POST logic
post_workflows = function(req, res) {
    workflows.create_workflow(req.body, function(wf) {
        res.setHeader('Content-Type', 'application/json'); 
        res.send(wf); 
    });
};

// GET logic
get_workflows = function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(workflows, null, 3));
};

// ROUTING
setup_routes = function() {
    app.get('/workflows', get_workflows); 
    app.post('/workflows', post_workflows);
};

// Server startup
start_server = function() {
    app.listen(3000, function () {
        console.log('Example app listening on port 3000!');
    });
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}

exports.post_workflows = post_workflows;
exports.get_workflows = get_workflows;