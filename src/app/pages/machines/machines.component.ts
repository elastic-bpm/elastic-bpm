import { Component, OnInit } from '@angular/core';

import { StatusService } from '../../services/status.service';
import { MachineService } from '../../services/machine.service';
import { ElasticService } from '../../services/elastic.service';

import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-machines',
  templateUrl: './machines.component.html',
  styleUrls: ['./machines.component.css']
})
export class MachinesComponent implements OnInit {
  title = 'Machines';
  scalingStatus: Status;
  machines: any[] = [];

  constructor(
    private statusService: StatusService,
    private machineService: MachineService,
    private elasticService: ElasticService
  ) { }

  ngOnInit() {
    this.getDockerStatus();
    this.machineService.machines.subscribe(machines => this.updateMachines(machines));
    this.elasticService.machineLoad.subscribe(machineLoad => this.updateMachineLoad(machineLoad));
  }

  updateMachines(updatedMachines) {
    updatedMachines.forEach(element => {
      let currentMachine = this.machines.find((a) => a.name === element.name);
      if (currentMachine) {
        element.load = currentMachine.load; // Save the load
        currentMachine = element; // Update the element
      } else {
        this.machines.push(element); // New machine
      }

      // Not removing machines for now
    });
  }

  updateMachineLoad(machineLoad) {
    this.machines.forEach((machine) => {
      if (Object.keys(machineLoad).indexOf(machine.name) !== -1) {
        machine.load = machineLoad[machine.name];
      }
    });
  }

  getDockerStatus(): void {
    this.statusService.getStatusList().subscribe(status => {
      this.scalingStatus = status['scaling'] !== undefined
        ? status['scaling']
        : { name: 'Scaling', statusCode: 500, message: 'no status' };
    });
  }

  startMachine(machineName: string, resourceGroup: string): void {
    this.machineService.startMachine(machineName, resourceGroup, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }

  stopMachine(machineName: string, resourceGroup: string): void {
    this.machineService.stopMachine(machineName, resourceGroup, (error) => {
      if (error) {
        console.log(error);
      }
    });
  }
}
