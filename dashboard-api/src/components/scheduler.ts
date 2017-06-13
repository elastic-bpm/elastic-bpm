export class Scheduler {
    Client = require('node-rest-client').Client;
    client = new this.Client();
    scheduler_host = process.env.SCHEDULER_HOST || 'localhost';
    status = {
        message: 'not updated yet',
        statusCode: 500
    };
    info: any = {};
    humanTasks: any[] = [];

    constructor(interval: number) {
        this.start_updates(interval);
    }

    private start_updates(interval: number) {
        this.update_status(interval);
        this.update_info(interval);
        this.update_human_tasks(interval);
    }

    private update_human_tasks(interval: number) {
        const req = this.client.get('http://' + this.scheduler_host + ':3210/tasks/human', (data: any, response: any) => {
            if (response.statusCode === 200) {
                this.humanTasks = data;
            }
            if (interval > 0) {
                setTimeout(() => this.update_human_tasks(interval), interval);
            }
        });

        req.on('error', (error: any) => {
            if (interval > 0) {
                setTimeout(() => this.update_human_tasks(interval), interval);
            }
        });
    }

    private update_status(interval: number) {
        const req = this.client.get('http://' + this.scheduler_host + ':3210/status',
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

    private update_info(interval: number) {
        const req = this.client.get('http://' + this.scheduler_host + ':3210/info', (data: any, response: any) => {
            if (response.statusCode === 200) {
                this.info = data;
                setTimeout(() => this.update_info(interval), interval);
            } else {
                setTimeout(() => this.update_info(interval), interval);
            }
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_info(interval), interval);
        });
    }

    set_policy(body: any) {
        return new Promise<any>((resolve, reject) => {
            console.log(body);
            const req = this.client.post('http://' + this.scheduler_host + ':3210/policy/' + body.policy,
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error: ' + data);
                    }
                });

            req.on('error', (error: any) => reject('error: ' + error));
        });
    }

    set_amount(body: any) {
        return new Promise<any>((resolve, reject) => {
            console.log(body);
            const req = this.client.post('http://' + this.scheduler_host + ':3210/amount/' + body.policy + '/' + body.amount,
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error: ' + data);
                    }
                });

            req.on('error', (error: any) => reject('error: ' + error));
        });
    }

    set_bounds(body: any) {
        return new Promise<any>((resolve, reject) => {
            console.log(body);
            const args = {
                data: body,
                headers: { 'Content-Type': 'application/json' }
            };
            const req = this.client.post('http://' + this.scheduler_host + ':3210/bounds', args,
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error: ' + data);
                    }
                });

            req.on('error', (error: any) => reject('error: ' + error));
        });
    }

    set_human_task(body: any) {
        return new Promise<any>((resolve, reject) => {
            console.log(body);
            let url = '';
            if (body.status === 'busy') {
                url = 'http://' + this.scheduler_host + ':3210/task/' + body.workflowId + '/' + body.taskId + '/busy';
            } else {
                url = 'http://' + this.scheduler_host + ':3210/task/' + body.workflowId + '/' + body.taskId;
            }

            const req = this.client.post(url, (data: any, response: any) => {
                if (response.statusCode === 200) {
                    this.update_human_tasks(0);
                    resolve(data);
                } else {
                    reject('Error: ' + data);
                }
            });

            req.on('error', (error: any) => reject('error: ' + error));
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

    get_info() {
        return new Promise<any>(resolve => resolve(this.info));
    }

    get_human_tasks() {
        return new Promise<any>(resolve => resolve(this.humanTasks));
    }
}
