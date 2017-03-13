import * as path from 'path';
import * as express from 'express';
import * as logger from 'morgan';
import * as bodyParser from 'body-parser';
import { TaskRepository } from './repositories/TaskRepository';

// Creates and configures an ExpressJS web server.
class App {

  // ref to Express instance
  public express: express.Application;
  private taskRepository: TaskRepository = new TaskRepository();

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
      res.status(500).send(error);
    }
  }

  // Configure API endpoints.
  private routes(): void {
    this.express.get('/status', (req, res) => res.send('ok'));

    this.express.get('/workflows', (req, res) => this.getJsonResult(this.taskRepository.getAllWorkflows(), req, res));
  }

}

export default new App().express;
