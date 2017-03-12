import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class SchedulerService {
    info: BehaviorSubject<{}> = new BehaviorSubject({});
    humanTasks: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        this.updateInfo(2000);
        this.updateHumanTasks(2000);
    }

    updateHumanTasks = function(interval) {
        this.http
            .get('/api/scheduler/tasks/human')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.humanTasks.next(res);
                    if (interval > 0) {
                        setTimeout(() => this.updateHumanTasks(interval), interval);
                    }
                },
                error => {
                    console.log(error);
                    if (interval > 0) {
                        setTimeout(() => this.updateHumanTasks(interval), interval);
                    }
                }
            );
    };

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

    startTask = function(workflowId, taskId, cb) {
        this.http
            .post('/api/scheduler/task/' , {workflowId: workflowId, taskId: taskId, status: 'busy'})
            .map(res => res.json())
            .subscribe(
                res => {
                    this.updateHumanTasks(0);
                    cb();
                },
                error => {
                    cb(error);
                }
            );
    };

    finishTask = function(workflowId, taskId, cb) {
        this.http
            .post('/api/scheduler/task/', {workflowId: workflowId, taskId: taskId})
            .map(res => res.json())
            .subscribe(
                res => {
                    this.updateHumanTasks(0);
                    cb();
                },
                error => {
                    cb(error);
                }
            );
    };

    setPolicy = function(policy, cb) {
        this.http
            .post('/api/scheduler/policy', {policy: policy})
            .map(res => res.json())
            .subscribe(
                res => {
                    cb();
                },
                error => {
                    cb(error);
                }
            );
    };

    setAmount = function(policy, amount, cb) {
        this.http
            .post('/api/scheduler/amount', {policy: policy, amount: amount})
            .map(res => res.json())
            .subscribe(
                res => {
                    cb();
                },
                error => {
                    cb(error);
                }
            );
    };
}
