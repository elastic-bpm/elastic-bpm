import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { TaskRepository } from './repositories/TaskRepository';
import { ResourceManager } from './resources/ResourceManager';

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;

  // No DI yet for repository & resource manager - exercise left for the reader
  private taskRepository: TaskRepository = new TaskRepository();
  private resourceManager: ResourceManager;

  // Run configuration methods on the Express instance.
  constructor() {
    this.express = express();
    this.middleware();
    this.routes();
    this.resourceManager = new ResourceManager('Off', 1, 2, 3, 5000);
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

    this.express.get('/task/count', (req, res) => this.getJsonResult(this.taskRepository.getTaskCount(), req, res));

    this.express.get('/task', (req, res) => this.getJsonResult(this.taskRepository.getAndFlagFreeWorkerTask(), req, res));
    this.express.get('/task/human', (req, res) => this.getJsonResult(this.taskRepository.getAndFlagFreeHumanTask(), req, res));

    this.express.get('/tasks/worker', (req, res) => this.getJsonResult(this.taskRepository.getAllWorkerTasks(), req, res));
    this.express.get('/tasks/worker/free', (req, res) => this.getJsonResult(this.taskRepository.getAllFreeWorkerTasks(), req, res));
    this.express.get('/tasks/human', (req, res) => this.getJsonResult(this.taskRepository.getAllHumanTasks(), req, res));
    this.express.get('/tasks/human/free', (req, res) => this.getJsonResult(this.taskRepository.getAllFreeHumanTasks(), req, res));
  }

}

export default new App().express;
