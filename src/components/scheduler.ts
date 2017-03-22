/*jshint esversion: 6 */

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

    start_updates(interval: number) {
        this.update_status(interval);
        this.update_info(interval);
        this.update_human_tasks(interval);
    }

    update_human_tasks(interval: number) {
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

    update_status(interval: number) {
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

    update_info(interval: number) {
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

    set_policy(body: any, cb: any) {
        console.log(body);
        const req = this.client.post('http://' + this.scheduler_host + ':3210/policy/' + body.policy,
            (data: any, response: any) => {
            if (response.statusCode === 200) {
                cb(null, data);
            } else {
                cb('Error: ' + data, null);
            }
        });

        req.on('error', (error: any) => {
            cb('error: ' + error, null);
        });
    }

    set_amount(body: any, cb: any) {
        console.log(body);
        const req = this.client.post('http://' + this.scheduler_host + ':3210/amount/' + body.policy + '/' + body.amount,
            (data: any, response: any) => {
            if (response.statusCode === 200) {
                cb(null, data);
            } else {
                cb('Error: ' + data, null);
            }
        });

        req.on('error', (error: any) => {
            cb('error: ' + error, null);
        });
    }

    execute(body: any, cb: any) {
        console.log(body);
        const args = {
            data: body,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = this.client.post('http://' + this.scheduler_host + ':3210/execute/', args,
        (data: any, response: any) => {
            if (response.statusCode === 200) {
                cb(null, data);
            } else {
                cb('Error: ' + data, null);
            }
        });

        req.on('error', (error: any) => {
            cb('error: ' + error, null);
        });
    }

    set_human_task(body: any, cb: any) {
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
                cb(null, data);
            } else {
                cb('Error: ' + data, null);
            }
        });

        req.on('error', (error: any) => {
            cb('error: ' + error, null);
        });
    }

    check_status() {
        return this.status;
    };

    get_info() {
        return this.info;
    }

    get_human_tasks() {
        return this.humanTasks;
    }
}
