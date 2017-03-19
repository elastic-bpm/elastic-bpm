import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { TaskRepository } from './repositories/TaskRepository';
import { Task } from './classes/Task';
import { ResourceManager } from './resources/ResourceManager';

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;

  // No DI yet for repository & resource manager - exercise left for the reader
  private taskRepository: TaskRepository = new TaskRepository();
  private resourceManager: ResourceManager = new ResourceManager('Off', 1, 2, 3, 5000);

  // Run configuration methods on the Express instance.
  constructor() {
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
    this.express.get('/status', (req, res) => res.send('ok'));

    // These getters modify the system - not REST compliant
    this.express.get('/task', (req, res) => this.getJsonResult(this.taskRepository.getAndFlagFreeWorkerTask(), req, res));
    this.express.get('/task/human', (req, res) => this.getJsonResult(this.taskRepository.getAndFlagFreeHumanTask(), req, res));

    // These post methods work for human & worker tasks
    this.express.post('/task/:workflow_id/:task_id/busy', (req, res) => {
      const taskToFlagBusy = new Task(req.params.task_id, 'todo', req.params.workflow_id);
      this.getJsonResult(this.taskRepository.flagTaskBusy(taskToFlagBusy), req, res);
    });

    this.express.post('/task/:workflow_id/:task_id', (req, res) => {
      const taskToFlagDone = new Task(req.params.task_id, 'busy', req.params.workflow_id);
      this.getJsonResult(this.taskRepository.flagTaskDone(taskToFlagDone), req, res);
    });

    // All kind of interesting facts on tasks
    this.express.get('/task/count', (req, res) => this.getJsonResult(this.taskRepository.getTaskCount(), req, res));
    this.express.get('/tasks', (req, res) => this.getJsonResult(this.taskRepository.getAllTasks(), req, res));
    this.express.get('/tasks/free', (req, res) => this.getJsonResult(this.taskRepository.getAllFreeTasks(), req, res));
    this.express.get('/tasks/worker', (req, res) => this.getJsonResult(this.taskRepository.getAllWorkerTasks(), req, res));
    this.express.get('/tasks/worker/free', (req, res) => this.getJsonResult(this.taskRepository.getAllFreeWorkerTasks(), req, res));
    this.express.get('/tasks/human', (req, res) => this.getJsonResult(this.taskRepository.getAllHumanTasks(), req, res));
    this.express.get('/tasks/human/free', (req, res) => this.getJsonResult(this.taskRepository.getAllFreeHumanTasks(), req, res));

    // Policy settings
    this.express.get('/policy', (req, res) => this.getJsonResult(this.resourceManager.getPolicy(), req, res));
    this.express.post('/policy/:policy', (req, res) => this.getJsonResult(this.resourceManager.setPolicy(req.params.policy), req, res));

    this.express.post('/amount/:policy/:amount', (req, res) => {
       this.getJsonResult(this.resourceManager.setAmount(req.params.policy, parseInt(req.params.amount, 0)), req, res);
    });

    this.express.get('/machinecount', (req, res) => this.getJsonResult(this.resourceManager.getActiveMachineCount(), req, res));
    this.express.get('/info', (req, res) => this.getJsonResult(this.resourceManager.getInfo(), req, res));
  }

}

export default new App().express;
