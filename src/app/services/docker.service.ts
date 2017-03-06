import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class DockerService {
    remoteInfo: BehaviorSubject<{}> = new BehaviorSubject({});
    remoteContainers: BehaviorSubject<any[]> = new BehaviorSubject([]);
    remoteServices: BehaviorSubject<any[]> = new BehaviorSubject([]);
    nodes: BehaviorSubject<any[]> = new BehaviorSubject([]);
    workers: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        const interval = 2000;
        this.updateRemoteInfo(interval);
        this.updateRemoteContainers(interval);
        this.updateRemoteServices(interval);
        this.updateNodes(interval);
        this.updateWorkers(interval);
    }

    updateWorkers(interval) {
        const sortWorkers = (a, b) => {
            if (a.CreatedAt < b.CreatedAt) {
                return -1;
            } else {
                return 1;
            }
        };

        this.http
            .get('/api/docker/workers')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.workers.next(res.sort(sortWorkers));
                    if (interval > 0) {
                        setTimeout(() => this.updateWorkers(interval), interval);
                    }
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateWorkers(interval), interval);
                }
            );
    }

    setNodeAvailability(hostname, availability, cb) {
        this.http
            .post('/api/docker/nodes/' + hostname + '/' + availability, null)
            .map(res => res.json())
            .subscribe(res => {
                this.updateNodes(0);
                cb(null, res);
            }, error => cb(error, null));
    }

    updateNodes(interval) {
        const sortNodes = (a, b) => {
            if (a.hostname < b.hostname) {
                return -1;
            } else {
                return 1;
            }
        };

        this.http
            .get('/api/docker/nodes')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.nodes.next(res.sort(sortNodes));
                    if (interval > 0) {
                        setTimeout(() => this.updateNodes(interval), interval);
                    }
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateNodes(interval), interval);
                }
            );
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
