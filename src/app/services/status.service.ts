import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Status } from '../classes/status.class';

import { StatusProxyService } from './status-proxy.service';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class StatusService {
  statusDict = {};
  statusSubjects: BehaviorSubject<{}> = new BehaviorSubject({});

  constructor(private http: Http) {
    new StatusProxyService(this.http, 'Redis', '/api/redis/status').getStatus().subscribe(status => {
      this.statusDict['redis'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Workflow', '/api/workflow/status').getStatus().subscribe(status => {
      this.statusDict['workflow'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Docker', '/api/docker/status').getStatus().subscribe(status => {
      this.statusDict['docker'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Human', '/api/human/status').getStatus().subscribe(status => {
      this.statusDict['human'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Scaling', '/api/scaling/status').getStatus().subscribe(status => {
      this.statusDict['scaling'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Scheduler', '/api/scheduler/status').getStatus().subscribe(status => {
      this.statusDict['scheduler'] = status;
      this.updateStatusList();
    });

    new StatusProxyService(this.http, 'Elastic', '/api/elastic/status').getStatus().subscribe(status => {
      this.statusDict['elastic'] = status;
      this.updateStatusList();
    });
  }

  updateStatusList(): void {
    this.statusSubjects.next(this.statusDict);
  }

  getStatusList(): Observable<Status[]> {
    return this.statusSubjects.asObservable();
  }

  getStatusObservable(component: string): Observable<Status> {
    return this.statusSubjects[component].asObservable();
  }
}
