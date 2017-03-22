import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Status } from '../classes/status.class';
import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class StatusProxyService {
    status: BehaviorSubject<Status> = new BehaviorSubject(new Status());

    constructor(private http: Http, private name: string, private statusURL: string) {
        this.refreshStatus();
        setInterval(() => this.refreshStatus(), 2000);
    }

    refreshStatus(): void {
        this.http
            .get(this.statusURL)
            .subscribe(res => this.updateStatus(res), error => this.updateStatus(error));
    }

    updateStatus(res: any): void {
        this.status.next({name: this.name, message: res._body, statusCode: res.status});
    }

    getStatus(): Observable<Status> {
        return this.status.asObservable();
    }

}
