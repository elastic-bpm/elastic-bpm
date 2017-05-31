/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

const os = require('os');
var log4js = require('log4js');

var elastic_host = process.env.ELASTIC_HOST || "localhost";
var elastic_port = process.env.ELASTIC_PORT || 12201;
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": elastic_host,
            "port": elastic_port,
            "type": "gelf",
            "hostname": "elastic-api@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});


var workflows = require('./repository/workflows');

post_workflows = function(req, res) {
    workflows.create_workflow(req.body, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(500).send("" + err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(workflow, null, 3));
        }
    });
};

post_multiple_workflows = function(req, res) {
    workflows.create_multiple_workflows(req.body, (err, workflow) => {
        if (err) {
            console.dir(err);
            res.status(500).send("" + err);
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

delete_all_workflows = function(req, res) {
    workflows.delete_all_workflows((err, data) => {
        if (err) {
            console.dir(err);
            res.status(500).send("Error: " + err);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify('ok', null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/workflows', get_workflows); 
    app.post('/workflows', post_workflows);
    app.post('/workflows/multiple', post_multiple_workflows);

    app.get('/workflows/:workflow_id', get_workflow_at);
    app.patch('/workflows/:workflow_id', update_workflow);
    app.delete('/workflows/:workflow_id',delete_workflow);

    app.delete('/workflows', delete_all_workflows);

    app.get('/status', (req, res) => res.send('ok'));
};

log_current_info = function() {
    workflows.get_all_workflows((err, workflow_array) => {
        var todo_tasks = 0;
        var busy_tasks = 0;
        var done_tasks = 0;
        for (var i = 0; i < workflow_array.length; i++) {
            todo_tasks += workflow_array[i].todo_nodes.length;
            busy_tasks += workflow_array[i].busy_nodes.length;
            done_tasks += workflow_array[i].done_nodes.length;
        }

        var workflow_stats = {
            workflow_count: workflow_array.length,
            todo_task_count: todo_tasks,
            busy_task_count: busy_tasks,
            done_task_count: done_tasks
        }

        console.log("workflow:current_info " + JSON.stringify(workflow_stats));
    });
}

// Server startup
start_server = function() {
    app.listen(3000, () => console.log('Elastic Workflow listening on port 3000!'));
    setInterval(() => {log_current_info();}, 5000); // Log every 5 seconds
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