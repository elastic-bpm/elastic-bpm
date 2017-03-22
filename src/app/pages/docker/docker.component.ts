import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { DockerService } from '../../services/docker.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-docker',
  templateUrl: './docker.component.html',
  styleUrls: ['./docker.component.css']
})
export class DockerComponent implements OnInit {
  title = 'Docker';
  dockerStatus: Status;
  remoteInfo = {};
  remoteServices = [];
  remoteContainers = [];

  constructor(private statusService: StatusService, private dockerService: DockerService) { }

  ngOnInit() {
    this.registerDockerStatus();
    this.dockerService.remoteInfo.subscribe(info => this.remoteInfo = info);
    this.dockerService.remoteContainers.subscribe(containers => this.remoteContainers = containers);
    this.dockerService.remoteServices.subscribe(services => this.remoteServices = services);
  }

  registerDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.dockerStatus = status['docker'] !== undefined
        ?  status['docker']
        : {name: 'Docker', statusCode: 500, message: 'no status'};
    });
  }
}
