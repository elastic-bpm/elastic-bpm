/*jshint esversion: 6 */

var sem = require('semaphore')(1);
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var task_repository = require('./repositories/tasks');
var policy = require('./policies/random');

post_task = function(req, res) {
    task = {
        workflow_id: req.params.workflow_id,
        task_id: req.params.task_id
    };

    task_repository.mark_task_done(task, (err) => {
        if (err) {
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

get_task = function(req, res) {
    sem.take(function() {
        task_repository.get_all_free_tasks((error, tasks) => {
            if (error) {
                sem.leave();
                res.status(500).send("Error: " + error);
            } else if (tasks === undefined || tasks.length === 0) {
                sem.leave();
                res.status(404).send("No todo tasks found.");
            } else {
                policy.select_task(tasks, (task) => {
                    task_repository.mark_task_busy(task, () => {
                        sem.leave();
                        res.setHeader('Content-Type', 'application/json');
                        res.send(JSON.stringify(task, null, 3));
                    });
                });
            }
        });
    }); // -sem
};

get_task_count = function(req, res) {
    task_repository.get_all_tasks((error, tasks) => {
        if (error) {
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tasks.length, null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
    app.get('/task/count', get_task_count);
    app.get('/task', get_task);
    app.post('/task/:workflow_id/:task_id', post_task);

    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    app.listen(3210, () => console.log('Elastic Scheduler listening on port 3210!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}