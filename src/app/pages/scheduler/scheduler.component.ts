import { Component, OnInit } from '@angular/core';
import { SchedulerService } from 'app/services/scheduler.service';
import { DockerService } from 'app/services/docker.service';
import { DropdownModule } from 'ng2-bootstrap/dropdown';
import { HistoryChartComponent } from './history-chart/history-chart.component';
import { Info } from '../../classes/info.class';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  title = 'Scheduler';
  info: Info = new Info();
  model = {
    staticAmount: 10,
    onDemandAmount: 15,
    learningAmount: 15,
    policy: "Off"
  };

  constructor(private schedulerService: SchedulerService) { }

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
