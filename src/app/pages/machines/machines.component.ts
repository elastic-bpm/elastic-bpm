import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  title = 'Machines';
  scalingStatus: Status;

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.getDockerStatus();
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.scalingStatus = status['scaling'] !== undefined
        ?  status['scaling']
        : {name: 'Scaling', statusCode: 500, message: 'no status'};
    });
  }


}
