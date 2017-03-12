import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class ElasticService {
    logMessages: BehaviorSubject<any[]> = new BehaviorSubject([]);
    machineLoad: BehaviorSubject<{}> = new BehaviorSubject({});

    constructor(private http: Http) {
        this.updateLogs(2000);
        this.updateMachineLoad(2000);
    }

    updateLogs = function(interval) {
        this.http
            .get('/api/elastic/logs')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.logMessages.next(res);
                    setTimeout(() => this.updateLogs(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateLogs(interval), interval);
                }
            );
    };

    updateMachineLoad = function(interval) {
        this.machineLoad.next({
            'node-01': {
                load1: [0.7, 0.8, 1],
                load5: [0.7, 0.8, 1],
                load15: [0.7, 0.8, 1]
            }
        });
        setTimeout(() => this.updateMachineLoad(interval), interval);
    };
}
