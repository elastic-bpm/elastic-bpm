import { Component, OnInit } from '@angular/core';
import { SchedulerService } from 'app/services/scheduler.service';
import { DockerService } from 'app/services/docker.service';
import { DropdownModule } from 'ng2-bootstrap/dropdown';
import { NgxChartsModule } from '@swimlane/ngx-charts';
import { curveStepAfter } from '../../../../node_modules/d3/build/d3';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  title = 'Scheduler';
  info = {};
  model = {
    staticAmount: 10,
    onDemandAmount: 15,
    learningAmount: 15,
    policy: "Off"
  };


  // For the chart
  curveStepAfter;
  colorScheme = {
    domain: ['#5AA454', '#A10A28', '#C7B42C', '#AAAAAA']
  };

  constructor(private schedulerService: SchedulerService) {
    Object.assign(this, { curveStepAfter })
  }

  ngOnInit() {
    this.schedulerService.info.subscribe(info => this.info = info);
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
