import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class DockerService {
    remoteInfo: BehaviorSubject<{}> = new BehaviorSubject({});
    remoteContainers: BehaviorSubject<any[]> = new BehaviorSubject([]);
    remoteServices: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        this.updateRemoteInfo(2000);
        this.updateRemoteContainers(2000);
        this.updateRemoteServices(2000);
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

    updateRemoteContainers(interval) {
        this.http
            .get('/api/docker/containers/remote')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.remoteContainers.next(res);
                    setTimeout(() => this.updateRemoteContainers(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateRemoteContainers(interval), interval);
                }
            );
    }

    updateRemoteServices(interval) {
        const sortServices = (a, b) => {
            if (a.Spec.Name < b.Spec.Name) {
                return -1;
            } else {
                return 1;
            }
        };

        this.http
            .get('/api/docker/services/remote')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.remoteServices.next(res.sort(sortServices));
                    setTimeout(() => this.updateRemoteServices(interval), interval);
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateRemoteServices(interval), interval);
                }
            );
    }}
