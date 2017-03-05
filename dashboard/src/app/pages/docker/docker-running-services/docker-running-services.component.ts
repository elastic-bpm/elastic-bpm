import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'app-docker-running-services',
  templateUrl: './docker-running-services.component.html',
  styleUrls: ['./docker-running-services.component.css']
})
export class DockerRunningServicesComponent implements OnInit {
  @Input()
  services: any[] = [];

  constructor() { }

  ngOnInit() {
  }

}
