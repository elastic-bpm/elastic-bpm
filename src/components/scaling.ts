/*jshint esversion: 6 */

export class Scaling {
    Client = require('node-rest-client').Client;
    client = new this.Client();
    scaling_host = process.env.SCALING_HOST || 'localhost';
    component = {};
    status = {
        message: 'not updated yet',
        statusCode: 500
    };
    virtualmachines: any[] = [];

    start_updates(interval: any) {
        this.update_status(interval);
        this.update_virtualmachines(10 * interval);
    }

    update_status(interval: any) {
        const req = this.client.get('http://' + this.scaling_host + ':8888/status',
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

    update_virtualmachines(interval: any) {
        const req = this.client.get('http://' + this.scaling_host + ':8888/virtualmachines',
            (data: any, response: any) => {
                this.virtualmachines = data;
                setTimeout(() => this.update_virtualmachines(interval), interval);
            });

        req.on('error', (error: any) => {
            console.log(error);
            this.status.statusCode = 500;
            this.status.message = error.code;

            setTimeout(() => this.update_virtualmachines(interval), interval);
        });
    }

    check_status() {
        return this.status;
    };

    get_virtualmachines() {
        return this.virtualmachines;
    };

    start_virtualmachine(resourcegroup: any, machine_id: any, cb: any) {
        const req = this.client.post('http://' + this.scaling_host + ':8888/virtualmachines/' + resourcegroup + '/' + machine_id,
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
    };

    stop_virtualmachine(resourcegroup: any, machine_id: any, cb: any) {
        const req = this.client.delete('http://' + this.scaling_host + ':8888/virtualmachines/' + resourcegroup + '/' + machine_id,
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
    };
}
