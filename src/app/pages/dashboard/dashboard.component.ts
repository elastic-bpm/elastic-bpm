import { Component, OnInit } from '@angular/core';
import { StatusService } from '../../services/status.service';
import { Status } from '../../classes/status.class';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css'],
})
export class DashboardComponent implements OnInit {
  title = 'Dashboard';
  statusDict = {};
  statusList: Status[] = [];

  constructor(private statusService: StatusService) { }

  ngOnInit() {
    this.getStatusList();
  };

  getStatusList() {
    this.statusService.getStatusList().subscribe(dict => {
      this.statusDict = dict;
      this.statusList = [];
      Object.keys(dict).forEach(item => {
        this.statusList.push(dict[item]);
      });
    });
  };

}
