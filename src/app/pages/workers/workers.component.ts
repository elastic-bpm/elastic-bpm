import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { DockerService } from '../../services/docker.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-workers',
  templateUrl: './workers.component.html',
  styleUrls: ['./workers.component.css']
})
export class WorkersComponent implements OnInit {
  title = 'Workers';
  dockerStatus: Status;
  workers: any[] = [];

  constructor(private statusService: StatusService, private dockerService: DockerService) { }

  ngOnInit() {
    this.getDockerStatus();
    this.dockerService.workers.subscribe(workers => this.workers = workers);
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.dockerStatus = status['docker'] !== undefined
        ?  status['docker']
        : {name: 'Docker', statusCode: 500, message: 'no status'};
    });
  }

}
