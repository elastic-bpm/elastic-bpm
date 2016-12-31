/*jshint esversion: 6 */

var moment = require('moment');
var sem = require('semaphore')(1);
var hsem = require('semaphore')(1);
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var task_repository = require('./repositories/tasks');
var policy = require('./policies/random');

var task_start = {};
var task_done = {};
var max_timeout_seconds = 600; // 10 mins for production

post_task_done = function(req, res) {
    task = {
        task_id: req.params.task_id,
        workflow_id: req.params.workflow_id
    };

    task_done[JSON.stringify(task)] = moment().format();
    task_repository.mark_task_done(task, (err) => {
        if (err) {
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

post_task_busy = function(req, res) {
    task = {
        task_id: req.params.task_id,
        workflow_id: req.params.workflow_id
    };

    task_start[JSON.stringify(task)] = moment().format();
    task_repository.mark_task_busy(task, (err) => {
        if (err) {
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

get_task_worker = function(req, res) {
    sem.take(function() {
        task_repository.get_all_free_worker_tasks((error, tasks) => {
            if (error) {
                sem.leave();
                res.status(500).send("Error: " + error);
            } else if (tasks === undefined || tasks.length === 0) {
                sem.leave();
                res.status(404).send("No todo tasks found.");
            } else {
                policy.select_task(tasks, (task) => {
                    task_start[JSON.stringify({task_id:task.task_id,workflow_id:task.workflow_id})] = moment().format();
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

get_all_human_tasks = function(req, res) {
    task_repository.get_all_unfinished_human_tasks((error, tasks) => {
        if (error) {
            res.status(500).send("Error: " + error);
        } else if (tasks === undefined || tasks.length === 0) {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify([], null, 3));
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tasks, null, 3));
        }
    });
};

get_human_task = function(req, res) {
    hsem.take(function() {
        task_repository.get_all_free_human_tasks((error, tasks) => {
            if (error) {
                hsem.leave();
                res.status(500).send("Error: " + error);
            } else if (tasks === undefined || tasks.length === 0) {
                hsem.leave();
                res.setHeader('Content-Type', 'application/json');
                res.send(JSON.stringify([], null, 3));
            } else {
                policy.select_task(tasks, (task) => {
                    task_repository.mark_task_busy(task, () => {
                        hsem.leave();
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

check_timeouts = function() {
    console.log("Checking timeouts...");
    Object.keys(task_start).forEach(function(key, index) {
        if (!task_done.hasOwnProperty(key)) {
            var task_start_time = moment(this[key]);
            console.log(" " + key + " started " + task_start_time.fromNow());
            if (task_start_time.isBefore(moment().subtract(max_timeout_seconds,'seconds'))) {
                console.log("!!That's a long time ago!! - moving task back to 'todo'");
                var task = JSON.parse(key);
                task_repository.mark_task_todo(task, (error) => {
                    if (error) {
                        console.log(error);
                    }

                    delete this[key];
                });
            }
        }
    }, task_start);
};

// ROUTING
setup_routes = function() {
    app.get('/task/count', get_task_count);
    app.get('/task', get_task_worker);
    app.get('/task/human', get_human_task);
    app.post('/task/:workflow_id/:task_id/busy', post_task_busy);
    app.post('/task/:workflow_id/:task_id', post_task_done);

    app.get('/tasks/human', get_all_human_tasks);

    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    setInterval(check_timeouts, 5000);
    app.listen(3210, () => console.log('Elastic Scheduler listening on port 3210!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}