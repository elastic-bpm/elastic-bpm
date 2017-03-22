/*jshint esversion: 6 */
import 'source-map-support/register';
const express = require('express'),
    app = express();

const bodyParser = require('body-parser');
app.use(bodyParser.json());

const server = require('http').createServer(app);

import { Workflow } from './components/workflows';
const workflows = new Workflow();

import { Redis } from './components/redis';
const redis = new Redis();

import { Docker } from './components/docker';
const docker = new Docker();

import { Human } from './components/human';
const human = new Human();

import { Scaling } from './components/scaling';
const scaling = new Scaling();

import { Scheduler } from './components/scheduler';
const scheduler = new Scheduler();

import { Elastic } from './components/elastic';
const elastic = new Elastic();

const os = require('os');
const log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            host: '137.116.195.67',
            port: 12201,
            type: 'gelf',
            hostname: 'elastic-dashboard-api@' + os.hostname(),
            layout: {
                type: 'pattern',
                pattern: '%m'
            },
            category: ['console']
        }
    ],
    replaceConsole: true
});

const return_status = function (status: any, req: any, res: any) {
    res.setHeader('Content-Type', 'application/json');
    res.status(status.statusCode).send(status.message);
};

const return_json = function (json: any, req: any, res: any) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(json, null, 2));
};

const create_workflows_from_file = function (req: any, res: any) {
    workflows.create_workflows_from_file(req, (error: any, data: any) => {
        if (error) {
            res.status(500).send(error);
        } else {
            console.log(data);
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

const delete_workflow = function (req: any, res: any) {
    workflows.delete_workflow(req.params['workflow_id'], (error: any, data: any) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

const set_node_availability = function (req: any, res: any) {
    docker.set_node_availability(req.params['hostname'], req.params['availability'], (error: any, data: any) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

const start_virtualmachine = function (req: any, res: any) {
    scaling.start_virtualmachine(req.params['resourcegroup'], req.params['machine_id'], (error: any, data: any) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

const stop_virtualmachine = function (req: any, res: any) {
    scaling.stop_virtualmachine(req.params['resourcegroup'], req.params['machine_id'], (error: any, data: any) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
};

// ROUTING
const setup_routes = function () {
    app.get('/api/redis/status', (req: any, res: any) => return_status(redis.check_status(), req, res));

    app.get('/api/workflow/status', (req: any, res: any) => return_status(workflows.check_status(), req, res));
    app.get('/api/workflow/workflows', (req: any, res: any) => return_json(workflows.get_workflows(), req, res));
    app.post('/api/workflow/workflows', (req: any, res: any) => return_json(workflows.create_workflow(req.body), req, res));
    app.delete('/api/workflow/workflows', (req: any, res: any) => return_json_post(workflows.delete_all_workflows, req, res));
    app.delete('/api/workflow/workflows/:workflow_id', (req: any, res: any) => delete_workflow(req, res));
    app.post('/api/workflow/workflows/file', (req: any, res: any) => create_workflows_from_file(req, res));

    app.get('/api/docker/status', (req: any, res: any) => return_status(docker.check_status(), req, res));
    app.get('/api/docker/info/remote', (req: any, res: any) => return_json(docker.get_remote_info(), req, res));
    app.get('/api/docker/containers/remote', (req: any, res: any) => return_json(docker.get_remote_containers(), req, res));
    app.get('/api/docker/services/remote', (req: any, res: any) => return_json(docker.get_remote_services(), req, res));

    app.post('/api/docker/services/workers', (req: any, res: any) => return_json_post(docker.create_workers, req, res));
    app.delete('/api/docker/services/workers', (req: any, res: any) => return_json_post(docker.delete_workers, req, res));

    app.get('/api/docker/nodes', (req: any, res: any) => return_json(docker.get_nodes(), req, res));
    app.post('/api/docker/nodes/:hostname/:availability', set_node_availability);

    app.get('/api/docker/workers', (req: any, res: any) => return_json(docker.get_workers(), req, res));

    app.get('/api/human/status', (req: any, res: any) => return_status(human.check_status(), req, res));
    app.get('/api/human/info', (req: any, res: any) => return_json(human.get_info(), req, res));
    app.post('/api/human/start', (req: any, res: any) => return_json_post(human.start_humans, req, res));
    app.post('/api/human/stop', (req: any, res: any) => return_json_post(human.stop_humans, req, res));

    app.get('/api/scaling/status', (req: any, res: any) => return_status(scaling.check_status(), req, res));
    app.get('/api/scaling/virtualmachines', (req: any, res: any) => return_json(scaling.get_virtualmachines(), req, res));
    app.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/start', start_virtualmachine);
    app.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/stop', stop_virtualmachine);

    app.get('/api/scheduler/status', (req: any, res: any) => return_status(scheduler.check_status(), req, res));
    app.get('/api/scheduler/info', (req: any, res: any) => return_json(scheduler.get_info(), req, res));
    app.get('/api/scheduler/tasks/human', (req: any, res: any) => return_json(scheduler.get_human_tasks(), req, res));
    app.post('/api/scheduler/task', (req: any, res: any) => return_json_post(scheduler.set_human_task, req, res));
    app.post('/api/scheduler/policy', (req: any, res: any) => return_json(scheduler.set_policy(req.body), req, res));
    app.post('/api/scheduler/amount', (req: any, res: any) => return_json_post(scheduler.set_amount, req, res));
    app.post('/api/scheduler/execute', (req: any, res: any) => return_json_post(scheduler.execute, req, res));

    app.get('/api/elastic/status', (req: any, res: any) => return_status(elastic.check_status(), req, res));
    app.get('/api/elastic/logs', (req: any, res: any) => return_json(elastic.get_messages(), req, res));
    app.get('/api/elastic/load', (req: any, res: any) => return_json(elastic.get_load(), req, res));
};

const start_check_status = function () {
    redis.update_status(2000);

    scheduler.start_updates(2000);
    workflows.start_updates(2000);
    docker.start_updates(10000); // 10sec for docker
    human.start_updates(2000);
    scaling.start_updates(2000);
    elastic.start_updates(2000);
};

// Server startup
const start_server = function () {
    server.listen(8080, () => console.log('Elastic-dashboard-api listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_check_status();
}
