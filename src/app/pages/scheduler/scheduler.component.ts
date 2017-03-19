import { Component, OnInit } from '@angular/core';
import { SchedulerService } from 'app/services/scheduler.service';
import { DockerService } from 'app/services/docker.service';
import { DropdownModule } from 'ng2-bootstrap/dropdown';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  title = 'Scheduler';
  info = {};
  history = [];
  model = {
    staticAmount: 10,
    onDemandAmount: 15,
    learningAmount: 15,
    policy: "Off"
  };

  constructor(private schedulerService: SchedulerService) { }

  ngOnInit() {
    this.schedulerService.info.subscribe(info => this.info = info);
    this.schedulerService.history.subscribe(history => this.history = history);
  }

  setPolicy(policy) {
    this.schedulerService.setPolicy(policy, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

  setAmount(policy: string, amount: number) {
    this.schedulerService.setAmount(policy, amount, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

}
