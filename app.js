/*jshint esversion: 6 */

var util = require('util');
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var multiparty = require('multiparty');
const fs = require('fs');
var moment = require('moment');

const os = require('os');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": "137.116.195.67",
            "port": 12201,
            "type": "gelf",
            "hostname": "elastic-dashboard@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

var redis_listener = require('./components/redis-listener');
var elastic_api = require('./components/elastic-api');
var elastic_scaling = require('./components/elastic-scaling');
var elastic_docker = require('./components/elastic-docker');
var elastic_scheduler = require('./components/elastic-scheduler');
var elastic_human = require('./components/elastic-human');

app.use(bodyParser.json());
app.use(express.static('public'));

var events = [];
var events_max_send = 100;
io.on('connect', (socket) => {
    events.slice(-events_max_send).forEach((event) => {
        socket.emit('event', event);
    });
});

redis_status = {
    name: "redis-listener",
    status: 0,
    message: "Not connected"
};

elastic_api_status = {
    name: "elastic-api",
    status: 0,
    message: "Not connected"
};

elastic_scaling_status = {
    name: "elastic-scaling",
    status: 0,
    message: "Not connected"
};

elastic_docker_status = {
    name: "elastic-docker",
    status: 0,
    message: "Not connected"
};

elastic_scheduler_status = {
    name: "elastic-scheduler",
    status: 0,
    message: "Not connected"
};

elastic_human_status = {
    name: "elastic-human",
    status: 0,
    message: "Not connected"
};

start_check_status = function() {
    redis_listener.connect_client(
        () => {
            redis_status.status = 500;
            redis_status.message = "Error connecting to Redis";
        },
        () => {
            redis_status.status = 200;
            redis_status.message = "Connected to Redis";
        } 
    );

    elastic_api.check_api_status(
        (err) => {
            elastic_api_status.status = 500;
            elastic_api_status.message = "" + err;
        },
        () => {
            elastic_api_status.status = 200;
            elastic_api_status.message = "Connected to elastic-api";
        }
    );

    elastic_scaling.check_scaling_status(
        (status_code, message) => {
            elastic_scaling_status.status = status_code;
            elastic_scaling_status.message = "" + message;
        },
        () => {
            elastic_scaling_status.status = 200;
            elastic_scaling_status.message = "Connected to elastic-scaling";
        }
    );

    elastic_docker.check_docker_status(
        (status_code, message) => {
            elastic_docker_status.status = status_code;
            elastic_docker_status.message = "" + message;
        },
        () => {
            elastic_docker_status.status = 200;
            elastic_docker_status.message = "Connected to elastic-docker";
        }
    );

    elastic_scheduler.check_status(
        (status_code, message) => {
            elastic_scheduler_status.status = status_code;
            elastic_scheduler_status.message = "" + message;
        },
        () => {
            elastic_scheduler_status.status = 200;
            elastic_scheduler_status.message = "Connected to elastic-scheduler";
        }
    );

    elastic_human.check_human_status(
        (err) => {
            elastic_human_status.status = 500;
            elastic_human_status.message = "" + err;
        },
        () => {
            elastic_human_status.status = 200;
            elastic_human_status.message = "Connected to elastic-human";
        }
    );
    // Check other components here
};

get_status = function(req, res) {
    status_data = [
        redis_status,
        elastic_api_status,
        elastic_scaling_status,
        elastic_docker_status,
        elastic_scheduler_status,
        elastic_human_status
    ];
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(status_data, null, 3));
};

return_data = function(res, error, data) {
    if (error) {
        res.status(500).send(error);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data, null, 3));
    }
};

get_containers_local = function(req, res) {
    elastic_docker.get_containers_local((error, data) => {return_data(res, error, data);});
};

get_containers_remote = function(req, res) {
    elastic_docker.get_containers_remote((error, data) => {return_data(res, error, data);});
};

get_docker_info_local = function(req, res) {
    elastic_docker.get_docker_info_local((error, data) => {return_data(res, error, data);});
};

get_docker_info_remote = function(req, res) {
    elastic_docker.get_docker_info_remote((error, data) => {return_data(res, error, data);});
};

get_services = function(req, res) {
    elastic_docker.get_services((error, data) => {return_data(res, error, data);});
};

get_nodes = function(req, res) {
    elastic_docker.get_nodes((error, data) => {return_data(res, error, data);});
};

post_node = function(req, res) {
    elastic_docker.set_node(req.params.hostname, req.params.availability, (error, data) => {return_data(res, error, data);});
};

get_workers = function(req, res) {
    elastic_docker.get_workers((error, data) => {return_data(res, error, data);});
};

get_virtualmachines = function(req, res) {
    elastic_scaling.get_vms((error, data) => {return_data(res, error, data);});
};

get_workflows = function(req, res) {
    elastic_api.get_workflows((error, data) => {return_data(res, error, data);});
};

get_task_amount = function(req, res) {
    elastic_api.get_workflows((err, workflows) => {
        if (err) {
            res.status(500).send(err);
        } else {
            task_amount = 0;
            workflows.forEach((workflow) => {
                task_amount = task_amount + workflow.todo_nodes.length;
            });
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(task_amount, null, 3));
        }
    });
};

create_workflow = function(req, res) {
    elastic_api.create_workflow(req.body, (error, data) => {return_data(res, error, data);});
};

get_workflows_from_file = function(req, callback) {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files) {
        if (err) {
            callback(err, null);
        } else if (files === undefined || files.workflow === undefined) {
            callback("Error creating workflow, file not found.", null);
        } else {
            workflows = {};
             try {
                workflows = JSON.parse(fs.readFileSync(files.workflow[0].path, 'utf8'));
                fs.unlink(files.workflow[0].path, (unlink_err) => {
                    if (unlink_err){
                        callback(unlink_err, null);
                    } else {
                        callback(null, workflows);
                    }
                });
            } catch (e) {
                callback(e, null);                
            }
        }
    });
};

scheduler_execute = function(req, res) {
    var policy = req.params.policy;
    var amount = req.params.amount;
    get_workflows_from_file(req, (error, workflows) => {
        if (error) {
            res.status(500).send("Error parsing workflow: " + error);
        } else {
            res.send("ok");
            setTimeout(() => scheduler_start_execute(policy, amount, workflows), 1000);
        }
    });
};

var scheduler_exeuction_data = {
    "scheduler-set-policy": "todo",
    "scheduler-wait-machines": "todo",
    "scheduler-wait-nodes": "todo",
    "scheduler-reset-workers-1": "todo",
    "scheduler-scale-workers": "todo",
    "scheduler-start-humans": "todo",
    "scheduler-upload-workflow": "todo",
    "scheduler-wait-for-finished": "todo",
    "scheduler-reset-workers-2": "todo",
    "scheduler-delete-workflows": "todo",
    "scheduler-set-policy-off": "todo"
};

scheduler_start_execute = function(policy, amount, workflows) {
    elastic_scheduler.post_policy(policy, () => {
        scheduler_exeuction_data["scheduler-set-policy"] = "done";
        scheduler_exeuction_data["scheduler-wait-machines"] = "busy";
        scheduler_wait_for_machines(amount, () => {
            scheduler_exeuction_data["scheduler-wait-machines"] = "done";
            scheduler_exeuction_data["scheduler-wait-nodes"] = "busy";
            scheduler_wait_for_nodes(amount, () => {
                scheduler_exeuction_data["scheduler-wait-nodes"] = "done";
                elastic_docker.delete_workers(() => {
                    elastic_docker.create_workers(() => {});
                });
                scheduler_exeuction_data["scheduler-reset-workers-1"] = "done";
                setTimeout(() => {
                    scheduler_scale_workers(4);
                    scheduler_exeuction_data["scheduler-scale-workers"] = "done";
                    scheduler_start_humans();  
                    scheduler_exeuction_data["scheduler-start-humans"] = "done";
                    elastic_api.create_multiple_workflows(workflows, (error, data) => {
                        if (error) {
                            console.log(error);
                        } else {
                            scheduler_exeuction_data["scheduler-upload-workflow"] = "done";
                            scheduler_exeuction_data["scheduler-wait-for-finished"] = "busy";
                            scheduler_wait_for_humans(() => {
                                scheduler_exeuction_data["scheduler-wait-for-finished"] = "done";
                                scheduler_execution_reset();
                            });
                        }
                    });                          
                }, 5000);
            });
        });
    });
};

scheduler_wait_for_humans = function(callback) {
    elastic_human.get_human_info((error, data) => {
        if (error) {
            console.log(error);
        } else {
            total_moment = moment(data.startTime + data.totalTime);
            if(total_moment.isBefore()) {
                callback();
            } else {
                setTimeout(() => scheduler_wait_for_humans(callback), 5000);
            }
        }
    });
};

delete_scheduler_execution = function(req, res) {
    scheduler_execution_reset(() => {return_data(res, null, "ok");});
};

scheduler_execution_reset = function() {
    elastic_docker.delete_workers(() => {
        elastic_docker.create_workers(() => {});
    });

    elastic_api.delete_all_workflows(() => {});

    elastic_scheduler.post_policy("Off", () => {});

    scheduler_exeuction_data = {
        "scheduler-set-policy": "todo",
        "scheduler-wait-machines": "todo",
        "scheduler-wait-nodes": "todo",
        "scheduler-reset-workers-1": "todo",
        "scheduler-scale-workers": "todo",
        "scheduler-start-humans": "todo",
        "scheduler-upload-workflow": "todo",
        "scheduler-wait-for-finished": "todo",
        "scheduler-reset-workers-2": "todo",
        "scheduler-delete-workflows": "todo",
        "scheduler-set-policy-off": "todo"
    };
};

scheduler_wait_for_machines = function(target_machines, callback) {
    elastic_scheduler.get_machine_count((error, data) => {
        if (!error && target_machines == data.active) {
            callback();
        } else {
            setTimeout(() => scheduler_wait_for_machines(target_machines, callback), 1000);
        }
    });
};

scheduler_wait_for_nodes = function(target_nodes, callback) {
    elastic_docker.get_nodes((error, data) => {
        if (!error && target_nodes == data.filter((n) => n.status === "ready").length) {
            callback();
        } else {
            setTimeout(() => scheduler_wait_for_nodes(target_nodes, callback), 1000);
        }
    });
};

scheduler_scale_workers = function(amount) {
    elastic_docker.update_workers(JSON.stringify({"scale": amount}), () => {});
};

scheduler_start_humans = function() {
    var data = { 
        on: 9, 
        off: 15,
        init: 8, 
        total: 41,
        amount: 5
    };
    elastic_human.start_humans(data, () => {});
};

create_workflow_using_file = function(req, res) {
    get_workflows_from_file(req, (error, workflows) => {
        if (error) {
            res.status(500).send("Error parsing workflow: " + e);
        } else {
            elastic_api.create_multiple_workflows(workflows, (error, data) => {
                if (error) {
                    res.status(500).send(error);
                } else {
                    res.setHeader('Content-Type', 'application/json');
                    res.send(JSON.stringify(data, null, 3));
                }
            });
        }
    });
};

delete_workflow = function(req, res) {
    workflow_id = req.params.workflow_id;
    elastic_api.delete_workflow(workflow_id, (error, data) => {return_data(res, error, data);});
};

delete_all_workflows = function(req, res) {
    elastic_api.delete_all_workflows((error, data) => {return_data(res, error, data);});
};

start_virtualmachine = function(req, res) {
    elastic_scaling.start_vm(req.params.resourcegroup, req.params.machine_id, (error, data) => {return_data(res, error, data);});    
};

stop_virtualmachine = function(req, res) {
    elastic_scaling.stop_vm(req.params.resourcegroup, req.params.machine_id, (error, data) => {return_data(res, error, data);});    
};

get_events = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(events, null, 3));
};

setup_updates = function() {
    elastic_docker.setup_updates();
};

update_workers = function(req, res) {
    elastic_docker.update_workers(req.body, (error, data) => {return_data(res, error, data);});
};

delete_workers = function(req, res) {
    elastic_docker.delete_workers((error, data) => {return_data(res, error, data);});
};

create_workers = function(req, res) {
    elastic_docker.create_workers((error, data) => {return_data(res, error, data);});
};

get_human_tasks = function(req, res) {
    elastic_scheduler.get_free_human_tasks((error, data) => {return_data(res, error, data);});
};

post_task_done = function(req, res) {
    task = {
        workflow_id: req.params.workflow_id,
        task_id: req.params.task_id
    };

    elastic_scheduler.mark_task_done(task, (err) => {
        if (err) {
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

post_task_busy = function(req, res) {
    task = {
        workflow_id: req.params.workflow_id,
        task_id: req.params.task_id
    };

    elastic_scheduler.mark_task_busy(task, (err) => {
        if (err) {
            res.status(500).send("Error: " + err);
        } else {
            res.send('ok');
        }
    });
};

get_scheduler_policy = function(req, res) {
    elastic_scheduler.get_policy((error, data) => {return_data(res, error, data);});
};

post_scheduler_policy = function(req, res) {
    elastic_scheduler.post_policy(req.params.policy, (error, data) => {return_data(res, error, data);});
};

get_scheduler_machine_count = function(req, res) {
    elastic_scheduler.get_machine_count((error, data) => {return_data(res, error, data);});
};

get_scheduler_amount = function(req, res) {
    elastic_scheduler.get_amount((error, data) => {return_data(res, error, data);});
};

post_scheduler_amount = function(req, res) {
    elastic_scheduler.post_amount(req.params.policy, req.params.amount, (error, data) => {return_data(res, error, data);});
};

get_scheduler_execution = function(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(scheduler_exeuction_data, null, 3));
};

delete_scheduler_execution = function(req, res) {
    scheduler_execution_reset();
};


post_start_humans = function(req, res) {
    elastic_human.start_humans(req.body, (error) => {
        if (error) {
            console.log("Error: " + error);
            res.status(500).send("Error: " + error);
        } else {
            res.send('ok');
        }
    });
};

get_human_info = function(req, res) {
    elastic_human.get_human_info((error, data) => {
        if (error) {
            console.log("Error: " + error);
            res.status(500).send("Error: " + error);
        } else {
            res.setHeader('Content-Type', 'application/json');
            res.send(JSON.stringify(data, null, 3));
        }
    });
};

// ROUTING
setup_routes = function() {
   app.get('/status', get_status);

   app.get('/events', get_events);

   app.get('/workflows', get_workflows);
   app.get('/workflows/tasks/amount', get_task_amount);
   app.post('/workflows', create_workflow);
   app.post('/workflows/file', create_workflow_using_file);
   app.delete('/workflows/:workflow_id', delete_workflow);
   app.delete('/workflows', delete_all_workflows);

   app.get('/virtualmachines', get_virtualmachines);
   app.post('/virtualmachines/:resourcegroup/:machine_id/start', start_virtualmachine);
   app.post('/virtualmachines/:resourcegroup/:machine_id/stop', stop_virtualmachine);

   app.get('/containers/local', get_containers_local);
   app.get('/containers/remote', get_containers_remote);

   app.get('/docker_info/local', get_docker_info_local);
   app.get('/docker_info/remote', get_docker_info_remote);

   app.get('/workers', get_workers);

   app.get('/services', get_services);
   app.put('/services/workers', update_workers);
   app.delete('/services/workers', delete_workers);
   app.post('/services/workers', create_workers);

   app.get('/nodes', get_nodes);
   app.post('/node/:hostname/:availability', post_node);

   app.get('/tasks/human', get_human_tasks);
   app.post('/task/:workflow_id/:task_id/busy', post_task_busy);
   app.post('/task/:workflow_id/:task_id', post_task_done);

   app.post('/starthumans', post_start_humans);
   app.get('/human/info', get_human_info);

   app.post('/scheduler/policy/:policy', post_scheduler_policy);
   app.get('/scheduler/policy', get_scheduler_policy);
   app.get('/scheduler/machinecount', get_scheduler_machine_count);
   app.get('/scheduler/amount', get_scheduler_amount);
   app.get('/scheduler/execution', get_scheduler_execution);
   app.delete('/scheduler/execution', delete_scheduler_execution);
   app.post('/scheduler/execution/:policy/:amount',scheduler_execute);
   app.post('/scheduler/amount/:policy/:amount', post_scheduler_amount);

};

// Emit events
start_casting = function () {
    redis_listener.register_events( (event) => {
        events.push(event);
        io.emit('event', event);
    });
};

// Server startup
start_server = function() {
    server.listen(8080, () => console.log('Elastic-dashboard listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_updates();
    setup_routes();
    start_server();
    start_check_status();
    start_casting();
}
