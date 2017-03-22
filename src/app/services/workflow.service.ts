import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';

import { Observable, BehaviorSubject } from 'rxjs/Rx';

@Injectable()
export class WorkflowService {
    workflows: BehaviorSubject<any[]> = new BehaviorSubject([]);

    constructor(private http: Http) {
        this.updateWorkflows(2000);
    }

    updateWorkflows(interval) {
        const sortWorkflows = (a, b) => {
            if (a.created < b.created) {
                return -1;
            } else {
                return 1;
            }
        };

        this.http
            .get('/api/workflow/workflows')
            .map(res => res.json())
            .subscribe(
                res => {
                    this.workflows.next(res.sort(sortWorkflows));
                    if (interval > 0) {
                        setTimeout(() => this.updateWorkflows(interval), interval);
                    }
                },
                error => {
                    console.log(error);
                    setTimeout(() => this.updateWorkflows(interval), interval);
                }
            );
    }

    createWorkflow(workflow, cb) {
        this.http
            .post('/api/workflow/workflows', workflow)
            .map(res => res.json())
            .subscribe(res => {
                cb(null, res);
                this.updateWorkflows(0);
            }, error => cb(error, null));
    }

    deleteWorkflow(workflowId, cb) {
        this.http
            .delete('/api/workflow/workflows/' + workflowId)
            .map(res => res.json())
            .subscribe(res => {
                cb(null, res);
                this.updateWorkflows(0);
            }, error => cb(error, null));
    }

    deleteAllWorkflows(cb) {
        this.http
            .delete('/api/workflow/workflows')
            .map(res => res.json())
            .subscribe(res => {
                cb(null, res);
                this.updateWorkflows(0);
            }, error => cb(error, null));
    }

    uploadWorkflowScript(filename, cb) {
        const formData = new FormData();
        formData.append('workflow', filename);

        const request = new XMLHttpRequest();
        request.open('POST', '/api/workflow/workflows/file');
        request.onreadystatechange = function (aEvt) {
            if (request.readyState === 4) {
                if (request.status === 200) {
                    cb(null);
                } else {
                    cb(aEvt.target);
                }
            }
        };
        request.send(formData);
    }
}
