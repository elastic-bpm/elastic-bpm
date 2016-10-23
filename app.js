/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var workflows = require('./repository/workflows');
var tasks = require('./logic/tasks');

post_workflows = function(req, res) {
    workflows.create_workflow(req.body, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

get_workflows = function (req, res) {
    workflows.get_all_workflows((err, workflow_array) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(workflow_array, null, 3));
    });
};

get_workflow_at = function (req, res) {
    workflows.get_workflow(req.params.workflow_id, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

delete_workflow = function (req, res) {
    workflows.delete_workflow(req.params.workflow_id, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

update_workflow = function(req, res) {
    workflows.update_workflow(req.body, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

get_tasks = function(req, res) {
    tasks.get_task((err, task) => {
        if (err) {
            console.dir(err);
            res.status(404).send('Not found');
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(task, null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/workflows', get_workflows); 
    app.post('/workflows', post_workflows);

    app.get('/workflows/:workflow_id', get_workflow_at);
    app.patch('/workflows/:workflow_id', update_workflow);
    app.delete('/workflows/:workflow_id',delete_workflow);

    app.get('/tasks', get_tasks);

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
exports.update_workflow = update_workflow;