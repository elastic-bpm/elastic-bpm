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

  constructor(private statusService: StatusService, private dockerService: DockerService) { }

  ngOnInit() {
    this.getDockerStatus();
    this.getRemoteInfo();
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.dockerStatus = status['docker'] !== undefined
        ?  status['docker']
        : {name: 'Docker', statusCode: 500, message: 'no status'};
    });
  }

  getRemoteInfo(): void {
    if (this.dockerStatus.statusCode === 200) {
      console.log('Got info from inside component!');
      console.log(this.dockerService.remoteInfo);
    }
  }

}
