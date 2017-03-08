import { Component, OnInit } from '@angular/core';
import { SchedulerService } from 'app/services/scheduler.service';
import { DockerService } from 'app/services/docker.service';

@Component({
  selector: 'app-scheduler',
  templateUrl: './scheduler.component.html',
  styleUrls: ['./scheduler.component.css']
})
export class SchedulerComponent implements OnInit {
  title = 'Scheduler';
  info = {};
  activeNodeCount = 0;

  constructor(private schedulerService: SchedulerService, private dockerService: DockerService) { }

  ngOnInit() {
    this.schedulerService.info.subscribe(info => this.info = info);
    this.dockerService.nodes.subscribe(nodes => this.activeNodeCount = nodes.filter(
      (node) => { return node.availability === 'active' && node.status === 'ready'; }).length
    );
  }

  setPolicy(policy) {
    this.schedulerService.setPolicy(policy, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

  changeAmount(policy: string, amount: number) {
    this.schedulerService.setAmount(policy, amount, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

}
