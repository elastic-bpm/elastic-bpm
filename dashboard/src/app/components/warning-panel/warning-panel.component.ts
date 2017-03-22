import { Component, OnInit, Input } from '@angular/core';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-warning-panel',
  templateUrl: './warning-panel.component.html',
  styleUrls: ['./warning-panel.component.css']
})
export class WarningPanelComponent implements OnInit {
  @Input()
  title: string;

  @Input()
  status: Status = {
    name: 'unknown',
    statusCode: 500,
    message: 'Not loaded yet'
  };

  constructor() { }

  ngOnInit() {
  }

}
