/*jshint esversion: 6 */

var sem = require('semaphore')(1);
var hsem = require('semaphore')(1);
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

const os = require('os');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": "137.116.195.67",
            "port": 12201,
            "type": "gelf",
            "hostname": "elastic-scheduler@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

var task_repository = require('./repositories/tasks');
var policy = require('./policies/random');
var stats = require('./stats/stats');

post_task_done = function(req, res) {
    task = {
        task_id: req.params.task_id,
        workflow_id: req.params.workflow_id
    };

    stats.mark_task_done(task);
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

    stats.mark_task_start(task);
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
                    stats.mark_task_start({task_id:task.task_id,workflow_id:task.workflow_id});
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
                res.status(404).send("No todo tasks found.");
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
    setInterval(stats.check_timeouts, 5000);
    app.listen(3210, () => console.log('Elastic Scheduler listening on port 3210!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}