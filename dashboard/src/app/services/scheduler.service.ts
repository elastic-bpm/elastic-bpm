import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';
import { Info } from '../classes/info.class';

@Injectable()
export class SchedulerService {
    info: BehaviorSubject<Info> = new BehaviorSubject(new Info());
    humanTasks: BehaviorSubject<any[]> = new BehaviorSubject([]);
    running: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        this.updateInfo(2000);
        this.updateHumanTasks(2000);
        this.updateRunning(2000);
    }

    updateHumanTasks(interval: number) {
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

    updateRunning(interval: number) {
        this.http
            .get('/api/running')
            .map(res => res.json())
            .subscribe(
            res => {
                this.running.next(res);
                if (interval > 0) {
                    setTimeout(() => this.updateRunning(interval), interval);
                }
            },
            error => {
                console.log(error);
                if (interval > 0) {
                    setTimeout(() => this.updateRunning(interval), interval);
                }
            }
            );
    };

    updateInfo(interval: number) {
        this.http
            .get('/api/scheduler/info')
            .map(res => <Info>res.json())
            .subscribe(
            res => {
                // Fixing the Date object, bloody hell!
                res.history.forEach((historyElement, x) => {
                    historyElement.series.forEach((kvPair, y) => {
                        res.history[x].series[y].name = new Date(res.history[x].series[y].name);
                    });
                });

                this.info.next(res);
                setTimeout(() => this.updateInfo(interval), interval);
            },
            error => {
                console.log(error);
                setTimeout(() => this.updateInfo(interval), interval);
            }
            );
    };

    startTask(workflowId, taskId, cb) {
        this.http
            .post('/api/scheduler/task/', { workflowId: workflowId, taskId: taskId, status: 'busy' })
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

    finishTask (workflowId, taskId, cb) {
        this.http
            .post('/api/scheduler/task/', { workflowId: workflowId, taskId: taskId })
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

    setPolicy(policy: string, cb) {
        this.http
            .post('/api/scheduler/policy', { policy: policy })
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

    setAmount(policy: string, amount: number, cb) {
        this.http
            .post('/api/scheduler/amount', { policy: policy, amount: amount })
            .map(res => res.json())
            .subscribe(
                res => cb(res),
                error => cb(error)
            );
    };

    executePolicy(policy: string, cb) {
        this.http
            .post('/api/runTest', { policy: policy })
            .map(res => res.json())
            .subscribe(
                res => cb(res),
                error => cb(error)
            );

    }
}
