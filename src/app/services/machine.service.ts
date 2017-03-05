import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class MachineService {
    machines: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        this.updateMachines(2000);
    }

    updateMachines(interval) {
        this.http
            .get('/api/scaling/virtualmachines')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.machines.next(res);
                    setTimeout(() => this.updateMachines(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateMachines(interval), interval);
                }
            )
    }

}
