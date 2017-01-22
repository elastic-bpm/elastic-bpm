/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

const stats_interval = 10000; // 10 secs
const resource_interval = 5000; // 5 secs

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
var resources = require('./resources/resources');

post_task_done = function(req, res) {
    task = {
        task_id: req.params.task_id,
        workflow_id: req.params.workflow_id
    };

    stats.mark_task_done(task);
    task_repository.mark_task_done(task, (err) => {
        if (err) {
            console.log(err);
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
            console.log(err);
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

get_task_worker = function(req, res) {
    task_repository.get_all_free_worker_tasks((error, tasks) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else if (tasks === undefined || tasks.length === 0) {
            res.status(404).send("No todo tasks found.");
        } else {
            policy.select_task(tasks, (task) => {

                stats.mark_task_start({task_id:task.task_id,workflow_id:task.workflow_id});
                task_repository.mark_task_busy(task, () => {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(task, null, 3));
                });

            });
        }
    });
};

get_all_human_tasks = function(req, res) {
    task_repository.get_all_unfinished_human_tasks((error, tasks) => {
        if (error) {
            console.log(error);
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
    task_repository.get_all_free_human_tasks((error, tasks) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else if (tasks === undefined || tasks.length === 0) {
            res.status(404).send("No todo tasks found.");
        } else {
            policy.select_task(tasks, (task) => {

                stats.mark_task_start({task_id:task.task_id,workflow_id:task.workflow_id});
                task_repository.mark_task_busy(task, () => {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(task, null, 3));
                });

            });
        }
    });
};

get_task_count = function(req, res) {
    task_repository.get_all_tasks((error, tasks) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(tasks.length, null, 3));
        }
    });
};


post_policy = function(req, res) {
    resources.set_policy(req.params.policy, (error, policy) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({policy: policy}, null, 3));
    });
};

get_policy = function(req, res) {
    resources.get_policy((error, policy) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify({policy: policy}, null, 3));
        }
    });
};

get_machine_count = function(req, res) {
    resources.get_machine_count((error, data) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));
        }
    });
};

post_at_start_amount = function(req, res) {
    resources.set_at_start_amount(req.params.amount, (error, amount) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({amount: amount}, null, 3));
    });
};

get_amount = function(req, res) {
    resources.get_amount((error, amount) => {
        if (error) {
            console.log(error);
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(amount, null, 3));
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

    app.post('/policy/:policy', post_policy);
    app.get('/policy', get_policy);

    app.get('/machinecount', get_machine_count);

    app.get('/amount', get_amount);
    app.post('/at_start_amount/:amount', post_at_start_amount);
};

// Server startup
start_server = function() {
    stats.check_timeouts();
    setInterval(() => {stats.check_timeouts();}, stats_interval);
    
    resources.check_resources();
    setInterval(() => {resources.check_resources();}, resource_interval);
    
    app.listen(3210, () => console.log('Elastic Scheduler listening on port 3210!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}