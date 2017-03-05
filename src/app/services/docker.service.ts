import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class DockerService {
  remoteInfo: BehaviorSubject<{}> = new BehaviorSubject({});

  constructor(private http: Http) {
    this.updateRemoteInfo(2000);
  }

  updateRemoteInfo(interval) {
      this.http
            .get('/api/docker/info/remote')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.remoteInfo.next(res);
                    setTimeout(() => this.updateRemoteInfo(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateRemoteInfo(interval), interval);
                }
            );
  }
}
