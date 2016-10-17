/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var workflows = require('./repository/workflows');

// POST logic
post_workflows = function(req, res) {
    workflows.create_workflow(req.body, (err, workflow) => {
        res.setHeader('Content-Type', 'application/json'); 
        res.send(workflow); 
    });
};

// GET logic
get_workflows = function (req, res) {
    workflows.get_all_workflows((err, workflow_array) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(workflow_array, null, 3));
    });
};

// GET logic
get_workflow_at = function (req, res) {
    workflows.get_workflow(req.params.workflowId, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/workflows/:workflowId', get_workflow_at);
    app.get('/workflows', get_workflows); 
    app.post('/workflows', post_workflows);
    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    app.listen(3000, () => console.log('Example app listening on port 3000!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}

exports.post_workflows = post_workflows;
exports.get_workflows = get_workflows;
exports.get_workflow_at = get_workflow_at;