import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { DockerService } from '../../services/docker.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit {
  title = 'Nodes';
  dockerStatus: Status;
  nodes: any[] = [];

  constructor(private statusService: StatusService, private dockerService: DockerService) { }

  ngOnInit() {
    this.getDockerStatus();
    this.dockerService.nodes.subscribe(nodes => this.nodes = nodes);
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.dockerStatus = status['docker'] !== undefined
        ?  status['docker']
        : {name: 'Docker', statusCode: 500, message: 'no status'};
    });
  }
}
