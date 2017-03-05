import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-nodes',
  templateUrl: './nodes.component.html',
  styleUrls: ['./nodes.component.css']
})
export class NodesComponent implements OnInit {
  title = 'Nodes';
  dockerStatus: Status;

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.getDockerStatus();
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.dockerStatus = status['docker'] !== undefined
        ?  status['docker']
        : {name: 'Docker', statusCode: 500, message: 'no status'};
    });
  }
}
