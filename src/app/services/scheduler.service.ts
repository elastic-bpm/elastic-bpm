import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class SchedulerService {
    info: BehaviorSubject<{}> = new BehaviorSubject({});

    constructor(private http: Http) {
        this.updateInfo(2000);
    }

    updateInfo = function(interval) {
        this.http
            .get('/api/scheduler/info')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.info.next(res);
                    setTimeout(() => this.updateInfo(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateInfo(interval), interval);
                }
            );
    };
}
