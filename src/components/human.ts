/*jshint esversion: 6 */

export class Human {
    Client = require('node-rest-client').Client;
    client = new this.Client();
    component = {};
    human_host = process.env.HUMAN_HOST || 'localhost';
    status = {
        message: 'not updated yet',
        statusCode: 500
    };
    info: any = {};

    start_updates(interval: any) {
        this.update_status(interval);
        this.update_info(interval);
    };

    update_info(interval: any) {
        const req = this.client.get('http://' + this.human_host + ':5555/info',
            (data: any, response: any) => {
                this.info = data;
                setTimeout(() => this.update_info(interval), interval);
            });

        req.on('error', (error: any) => {
            this.status.statusCode = 500;
            this.status.message = error.code;

            setTimeout(() => this.update_info(interval), interval);
        });

    };

    update_status(interval: any) {
        const req = this.client.get('http://' + this.human_host + ':5555/status',
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
    };

    check_status() {
        return this.status;
    };

    get_info() {
        return this.info;
    };

    start_humans(body: any, cb: any) {
        const args = {
            data: body,
            headers: { 'Content-Type': 'application/json' }
        };
        const req = this.client.post('http://' + this.human_host + ':5555/start', args,
            (data: any, response: any) => {
                cb(null, data);
            });

        req.on('error', (error: any) => {
            cb(error, null);
        });
    }

    stop_humans(body: any, cb: any) {
        const req = this.client.post('http://' + this.human_host + ':5555/stop',
            (data: any, response: any) => {
                cb(null, data);
            });

        req.on('error', (error: any) => {
            cb(error, null);
        });
    }
}
