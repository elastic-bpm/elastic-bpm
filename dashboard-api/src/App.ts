import { Workflow } from './components/workflows';
import { Redis } from './components/redis';
import { Docker } from './components/docker';
import { Human } from './components/human';
import { Scaling } from './components/scaling';
import { Scheduler } from './components/scheduler';
import { Elastic } from './components/elastic';
import { TestRunner } from './components/TestRunner';

import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';

const interval = 2000;

// Creates and configures an ExpressJS web server.
class App {

    // ref to Express instance
    public express: express.Application;

    // No DI yet for repository & resource manager - exercise left for the reader
    private workflow = new Workflow(interval);
    private redis = new Redis(interval);
    private docker = new Docker(interval);
    private human = new Human(interval);
    private scaling = new Scaling(interval);
    private scheduler = new Scheduler(interval);
    private elastic = new Elastic(interval);
    private testRunner: TestRunner;

    // Run configuration methods on the Express instance.
    constructor() {
        this.testRunner = new TestRunner(this.scheduler, this.docker);
        this.express = express();
        this.middleware();
        this.routes();
    }

    // Configure Express middleware.
    private middleware(): void {
        this.express.use(logger('dev'));
        this.express.use(bodyParser.json());
        this.express.use(bodyParser.urlencoded({ extended: false }));
    }

    private async getJsonResult(getResult: Promise<any>, req: express.Request, res: express.Response) {
        try {
            const result = await getResult;
            res.json(result);
        } catch (error) {
            console.log('Error!');
            console.log(error);
            res.status(500).send('Error: ' + error);
        }
    }

    // Configure API endpoints.
    private routes(): void {
        this.express.get('/api/redis/status', (req: any, res: any) =>
            this.getJsonResult(this.redis.check_status(), req, res));

        this.express.get('/api/workflow/status', (req: any, res: any) =>
            this.getJsonResult(this.workflow.check_status(), req, res));
        this.express.get('/api/workflow/workflows', (req: any, res: any) =>
            this.getJsonResult(this.workflow.get_workflows(), req, res));
        this.express.post('/api/workflow/workflows', (req: any, res: any) =>
            this.getJsonResult(this.workflow.create_workflow(req.body), req, res));
        this.express.delete('/api/workflow/workflows', (req: any, res: any) =>
            this.getJsonResult(this.workflow.delete_all_workflows(), req, res));
        this.express.delete('/api/workflow/workflows/:workflow_id', (req: any, res: any) =>
            this.getJsonResult(this.workflow.delete_workflow(req.params.workflow_id), req, res));
        this.express.post('/api/workflow/workflows/file', (req: any, res: any) =>
            this.getJsonResult(null, req, res));

        this.express.get('/api/docker/status', (req: any, res: any) =>
            this.getJsonResult(this.docker.check_status(), req, res));
        this.express.get('/api/docker/info/remote', (req: any, res: any) =>
            this.getJsonResult(this.docker.get_remote_info(), req, res));
        this.express.get('/api/docker/containers/remote', (req: any, res: any) =>
            this.getJsonResult(this.docker.get_remote_containers(), req, res));
        this.express.get('/api/docker/services/remote', (req: any, res: any) =>
            this.getJsonResult(this.docker.get_remote_services(), req, res));

        this.express.post('/api/docker/services/workers', (req: any, res: any) =>
            this.getJsonResult(this.docker.create_workers(), req, res));
        this.express.delete('/api/docker/services/workers', (req: any, res: any) =>
            this.getJsonResult(this.docker.delete_workers(), req, res));

        this.express.get('/api/docker/nodes', (req: any, res: any) =>
            this.getJsonResult(this.docker.get_nodes(), req, res));
        this.express.post('/api/docker/nodes/:hostname/:availability', (req, res) =>
            this.getJsonResult(this.docker.set_node_availability(req.params.hostname, req.params.availability), req, res));

        this.express.get('/api/docker/workers', (req: any, res: any) =>
            this.getJsonResult(this.docker.get_workers(), req, res));

        this.express.get('/api/human/status', (req: any, res: any) =>
            this.getJsonResult(this.human.check_status(), req, res));
        this.express.get('/api/human/info', (req: any, res: any) =>
            this.getJsonResult(this.human.get_info(), req, res));
        this.express.post('/api/human/start', (req: any, res: any) =>
            this.getJsonResult(this.human.start_humans(req.body), req, res));
        this.express.post('/api/human/stop', (req: any, res: any) =>
            this.getJsonResult(this.human.stop_humans(), req, res));

        this.express.get('/api/scaling/status', (req: any, res: any) =>
            this.getJsonResult(this.scaling.check_status(), req, res));
        this.express.get('/api/scaling/virtualmachines', (req: any, res: any) =>
            this.getJsonResult(this.scaling.get_virtualmachines(), req, res));
        this.express.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/start', (req: any, res: any) =>
            this.getJsonResult(this.scaling.start_virtualmachine(req.params.resourcegroup, req.params.machine_id), req, res));
        this.express.post('/api/scaling/virtualmachines/:resourcegroup/:machine_id/stop', (req: any, res: any) =>
            this.getJsonResult(this.scaling.stop_virtualmachine(req.params.resourcegroup, req.params.machine_id), req, res));

        this.express.get('/api/scheduler/status', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.check_status(), req, res));
        this.express.get('/api/scheduler/info', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.get_info(), req, res));
        this.express.get('/api/scheduler/tasks/human', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.get_human_tasks(), req, res));
        this.express.post('/api/scheduler/task', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.set_human_task(req.body), req, res));
        this.express.post('/api/scheduler/policy', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.set_policy(req.body), req, res));
        this.express.post('/api/scheduler/amount', (req: any, res: any) =>
            this.getJsonResult(this.scheduler.set_amount(req.body), req, res));

        this.express.post('/api/runTest', (req: any, res: any) =>
            this.getJsonResult(this.testRunner.runTest(req.body), req, res));
        this.express.get('/api/running', (req: any, res: any) =>
            this.getJsonResult(this.testRunner.getRunning(), req, res));

        this.express.get('/api/elastic/status', (req: any, res: any) =>
            this.getJsonResult(this.elastic.check_status(), req, res));
        this.express.get('/api/elastic/logs', (req: any, res: any) =>
            this.getJsonResult(this.elastic.get_messages(), req, res));
        this.express.get('/api/elastic/load', (req: any, res: any) =>
            this.getJsonResult(this.elastic.get_load(), req, res));
    }
}

export default new App().express;
