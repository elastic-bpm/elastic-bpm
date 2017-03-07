import { Component, OnInit } from '@angular/core';
import { SchedulerService } from 'app/services/scheduler.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  title = 'Scheduler';
  info = {};

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

}
