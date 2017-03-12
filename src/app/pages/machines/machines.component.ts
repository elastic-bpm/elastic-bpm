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

  renderChartlets() {
    window['Chartlets'].render();
  }

  loadAsString(node) {
    const machine = this.machines.find((m) => m.name === node);
    if (machine === undefined || machine.load === undefined) {
      return '';
    } else {
      return JSON.stringify(machine.load.load1) + JSON.stringify(machine.load.load5) + JSON.stringify(machine.load.load15);
    }
  }

  updateMachines(updatedMachines) {
    updatedMachines.forEach(element => {
      const currentMachine = this.machines.find((a) => a.name === element.name);
      if (currentMachine) {
        currentMachine.powerState = element.powerState;
        if (element.powerState !== 'VM running') {
          currentMachine.load = [];
        }
      } else {
        element.load = [];
        this.machines.push(element); // New machine
      }

      // Not removing machines for now
    });
  }

  updateMachineLoad(machineLoad) {
    this.machines.forEach((machine) => {
      if (machine.powerState === 'VM running' && Object.keys(machineLoad).indexOf(machine.name) !== -1) {
        machine.load = machineLoad[machine.name];
      }
    });

    this.renderChartlets();
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
