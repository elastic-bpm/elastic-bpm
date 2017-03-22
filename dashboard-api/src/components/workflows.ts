export class Workflow {
    Client = require('node-rest-client').Client;
    multiparty = require('multiparty');
    fs = require('fs');
    client = new this.Client();
    workflow_host = process.env.API_HOST || 'localhost';
    status = {
        message: 'not updated yet',
        statusCode: 500
    };
    workflows: any[] = [];

    constructor(interval: number) {
        this.start_updates(interval);
    }

    private start_updates(interval: any) {
        this.update_status(interval);
        this.update_workflows(interval);
    }

    update_status(interval: any) {
        const req = this.client.get('http://' + this.workflow_host + ':3000/status',
            (data: any, response: any) => {
                this.status.statusCode = response.statusCode;
                this.status.message = response.statusMessage;

                setTimeout(() => this.update_status(interval), interval);
            });

        req.on('error', (error: any) => {
            this.status.statusCode = 500;
            this.status.message = error.code;

            setTimeout(() => this.update_status(interval), interval);
        });
    }

    update_workflows(interval: any) {
        const req = this.client.get('http://' + this.workflow_host + ':3000/workflows',
            (data: any, response: any) => {
                this.workflows = data;
                setTimeout(() => this.update_workflows(interval), interval);
            });

        req.on('error', (error: any) => {
            this.status.statusCode = 500;
            this.status.message = error.code;

            setTimeout(() => this.update_workflows(interval), interval);
        });
    }

    create_workflow(body: any): Promise<any> {
        const args = {
            data: body,
            headers: { 'Content-Type': 'application/json' }
        };

        return new Promise<any>((resolve, reject) => {
            const req = this.client.post('http://' + this.workflow_host + ':3000/workflows', args,
                (data: any, response: any) => {
                    resolve(data);
                });

            req.on('error', (error: any) => {
                reject(error);
            });
        });
    };

    delete_workflow(workflowId: any) {
        return new Promise<any>((resolve, reject) => {
            const req = this.client.delete('http://' + this.workflow_host + ':3000/workflows/' + workflowId,
                (data: any, response: any) => resolve(data));

            req.on('error', (error: any) => reject(error));
        });
    }

    delete_all_workflows(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            const req = this.client.delete('http://' + this.workflow_host + ':3000/workflows',
                (data: any, response: any) => resolve(data));

            req.on('error', (error: any) => reject(error));
        });
    }

    get_workflows_from_file(req: any, cb: any) {
        const form = new this.multiparty.Form();
        form.parse(req, (err: any, fields: any, files: any) => {
            if (err) {
                cb(err, null);
            } else if (files === undefined || files.workflow === undefined) {
                cb('Error creating workflow, file not found.', null);
            } else {
                let workflowsFromFile = {};
                try {
                    workflowsFromFile = JSON.parse(this.fs.readFileSync(files.workflow[0].path, 'utf8'));
                    this.fs.unlink(files.workflow[0].path, (unlink_err: any) => {
                        if (unlink_err) {
                            cb(unlink_err, null);
                        } else {
                            cb(null, workflowsFromFile);
                        }
                    });
                } catch (e) {
                    cb(e, null);
                }
            }
        });
    };

    create_workflows_from_file(req: any, cb: any) {
        this.get_workflows_from_file(req, (error: any, workflows: any) => {
            if (error) {
                cb(error, null);
            } else {
                if (workflows.length === 0) {
                    cb('No workflows to create!', null);
                }

                const args = {
                    data: workflows,
                    headers: { 'Content-Type': 'application/json' }
                };
                const req2 = this.client.post('http://' + this.workflow_host + ':3000/workflows/multiple', args,
                    (data: any, response: any) => {
                        if (response.statusCode === 200) {
                            cb(null, data);
                        }
                    });

                req2.on('error', (err: any) => {
                    cb('' + err, null);
                });
            }
        });
    }

    check_status(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.status.statusCode === 200) {
                resolve(this.status.message);
            } else {
                reject(this.status.message);
            }
        });
    };

    get_workflows(): Promise<any[]> {
        return new Promise<any[]>(resolve => resolve(this.workflows));
    };
}
