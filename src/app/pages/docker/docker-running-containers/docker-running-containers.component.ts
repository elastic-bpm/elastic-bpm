import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-docker-running-containers',
  templateUrl: './docker-running-containers.component.html',
  styleUrls: ['./docker-running-containers.component.css']
})
export class DockerRunningContainersComponent implements OnInit {
  @Input()
  containers: any[] = [];

  constructor() { }

  ngOnInit() {
  }

}
