/*jshint esversion: 6 */

var express = require('express'),
    app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

var server = require('http').createServer(app);

var workflows = require('./components/workflows');
var redis = require('./components/redis');
var docker = require('./components/docker');
var human = require('./components/human');
var scaling = require('./components/scaling');
var scheduler = require('./components/scheduler');
var elastic = require('./components/elastic');

const os = require('os');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": "137.116.195.67",
            "port": 12201,
            "type": "gelf",
            "hostname": "elastic-dashboard-api@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

var return_status = function(check, req, res) {
    let status = check();
    res.setHeader('Content-Type', 'application/json');
    res.status(status.statusCode).send(status.message);
};

var return_json = function(getObject, req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(getObject(), null, 2));
};

var return_json_post = function(postObject, req, res) {
    res.setHeader('Content-Type', 'application/json');
    postObject(req.body, (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

var create_workflows_from_file = function(req, res) {
    workflows.create_workflows_from_file(req, (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log(data);
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

var delete_workflow = function(req, res) {
    workflows.delete_workflow(req.params['workflow_id'], (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

var set_node_availability = function(req, res) {
    docker.set_node_availability(req.params['hostname'], req.params['availability'], (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

var start_virtualmachine = function (req, res) {
    scaling.start_virtualmachine(req.params['resourcegroup'], req.params['machine_id'], (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
}

var stop_virtualmachine = function (req, res) {
    scaling.stop_virtualmachine(req.params['resourcegroup'], req.params['machine_id'], (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
}

// ROUTING
setup_routes = function() {
   app.get('/api/redis/status', (req, res) => return_status(redis.check_status, req, res));

   app.get('/api/workflow/status', (req, res) => return_status(workflows.check_status, req, res));
   app.get('/api/workflow/workflows', (req, res) => return_json(workflows.get_workflows, req, res));
   app.post('/api/workflow/workflows', (req, res) => return_json_post(workflows.create_workflow, req, res));
   app.delete('/api/workflow/workflows', (req, res) => return_json_post(workflows.delete_all_workflows, req, res));
   app.delete('/api/workflow/workflows/:workflow_id', (req, res) => delete_workflow(req, res));
   app.post('/api/workflow/workflows/file', (req, res) => create_workflows_from_file(req, res));

   app.get('/api/docker/status', (req, res) => return_status(docker.check_status, req, res));
   app.get('/api/docker/info/remote', (req, res) => return_json(docker.get_remote_info, req, res));
   app.get('/api/docker/containers/remote', (req, res) => return_json(docker.get_remote_containers, req, res));
   app.get('/api/docker/services/remote', (req, res) => return_json(docker.get_remote_services, req, res));
   
   app.post('/api/docker/services/workers', (req, res) => return_json_post(docker.create_workers, req, res));
   app.delete('/api/docker/services/workers', (req, res) => return_json_post(docker.delete_workers, req, res));
   
   app.get('/api/docker/nodes', (req, res) => return_json(docker.get_nodes, req, res));
   app.post('/api/docker/nodes/:hostname/:availability', set_node_availability);

   app.get('/api/docker/workers', (req, res) => return_json(docker.get_workers, req, res));

   app.get('/api/human/status', (req, res) => return_status(human.check_status, req, res));
   app.get('/api/human/info', (req, res) => return_json(human.get_info, req, res));
   app.post('/api/human/start', (req, res) => return_json_post(human.start_humans, req, res));
   app.post('/api/human/stop', (req, res) => return_json_post(human.stop_humans, req, res));
   
   app.get('/api/scaling/status', (req, res) => return_status(scaling.check_status, req, res));
   app.get('/api/scaling/virtualmachines', (req, res) => return_json(scaling.get_virtualmachines, req, res));
   app.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/start', start_virtualmachine);
   app.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/stop', stop_virtualmachine);

   app.get('/api/scheduler/status', (req, res) => return_status(scheduler.check_status, req, res));
   app.get('/api/scheduler/info', (req, res) => return_json(scheduler.get_info, req, res));
   app.get('/api/scheduler/tasks/human', (req, res) => return_json(scheduler.get_human_tasks, req, res));
   app.post('/api/scheduler/task', (req, res) => return_json_post(scheduler.set_human_task, req, res));
   app.post('/api/scheduler/policy', (req, res) => return_json_post(scheduler.set_policy, req, res));
   app.post('/api/scheduler/amount', (req, res) => return_json_post(scheduler.set_amount, req, res));
   app.post('/api/scheduler/execute', (req, res) => return_json_post(scheduler.execute, req, res));

   app.get('/api/elastic/status', (req, res) => return_status(elastic.check_status, req, res));
   app.get('/api/elastic/logs', (req, res) => return_json(elastic.get_messages, req, res));
   app.get('/api/elastic/load', (req, res) => return_json(elastic.get_load, req, res));
};

start_check_status = function() {
    redis.update_status(2000);
    
    scheduler.start_updates(2000);
    workflows.start_updates(2000);
    docker.start_updates(10000); // 10sec for docker
    human.start_updates(2000);
    scaling.start_updates(2000);
    elastic.start_updates(2000);
};

// Server startup
start_server = function() {
    server.listen(8080, () => console.log('Elastic-dashboard-api listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_check_status();
}
