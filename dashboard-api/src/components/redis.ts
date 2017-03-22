/*jshint esversion: 6 */

export class Redis {
    redis = require('redis');
    client: any = {};
    status = {
        message: 'not updated yet',
        statusCode: 500
    };

    constructor(interval: number) {
        this.update_status(interval);
    }

    private update_status(interval: any) {
        this.client = this.redis.createClient(6379, process.env.REDIS_HOST);

        this.client.on('error', () => {
            this.status = {
                message: 'error',
                statusCode: 500
            };
        });

        this.client.on('ready', () => {
            this.status = {
                message: 'ok',
                statusCode: 200
            };
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
}
