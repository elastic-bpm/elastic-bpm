import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class HumanService {
    info: BehaviorSubject<{}> = new BehaviorSubject({});

    constructor(private http: Http) {
        this.updateInfo(2000);
    }

    updateInfo = function(interval) {
        this.http
            .get('/api/human/info')
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

    startHumans = function(params, cb) {
        this.http
            .post('/api/human/start', params)
            .map(res => res.json())
            .subscribe(res => cb(null, res), error => cb(error, null));
    };

    stopHumans = function(cb) {
        this.http
            .post('/api/human/stop')
            .map(res => res.json())
            .subscribe(res => cb(null, res), error => cb(error, null));
    };
}
