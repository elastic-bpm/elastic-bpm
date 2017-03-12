import { Component, OnInit } from '@angular/core';
import { HumanService } from '../../services/human.service';
import { SchedulerService } from '../../services/scheduler.service';

@Component({
  selector: 'app-humans',
  templateUrl: './humans.component.html',
  styleUrls: ['./humans.component.css']
})
export class HumansComponent implements OnInit {
  title = 'Humans';
  info = {};

  humanParams = {
    on: 9,
    off: 15,
    init: 8,
    total: 41,
    amount: 5
  };

  tasks = [];

  constructor(private humanService: HumanService, private schedulerService: SchedulerService) { }

  ngOnInit() {
    this.humanService.info.subscribe(info => this.info = info);
    this.schedulerService.humanTasks.subscribe(tasks => this.tasks = tasks);
  }

  startTask(workflowId, taskId) {
    this.schedulerService.startTask(workflowId, taskId, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

  finishTask(workflowId, taskId) {
    this.schedulerService.finishTask(workflowId, taskId, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

  startHumans() {
    this.humanService.startHumans(this.humanParams, (error, res) => {
      if (error) {
        console.log('Error!');
        console.log(error);
      } else {
        console.log(res);
      }
    });
  }

  stopHumans() {
    this.humanService.stopHumans((error, res) => {
      if (error) {
        console.log('Error!');
        console.log(error);
      } else {
        console.log(res);
      }
    });
  }
}
