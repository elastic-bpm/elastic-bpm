import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class DockerService {
  remoteInfo = {};

  constructor(private http: Http) {
      this.http
            .get('/api/docker/info/remote')
            .map(res => res.json())
            .subscribe(
                res => this.updateRemoteInfo(res),
                error => this.errorRemoteInfo(error)
            );
  }

  updateRemoteInfo(res) {
      console.log('Got remote info');
      console.log(res);
      this.remoteInfo = res;
  }

  errorRemoteInfo(error) {
      console.log('Got remote error');
      console.log(error);
  }
}
