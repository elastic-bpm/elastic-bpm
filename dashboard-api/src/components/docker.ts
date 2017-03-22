/*jshint esversion: 6 */

export class Docker {
    Client = require('node-rest-client').Client;
    client = new this.Client();
    docker_host = process.env.DOCKER_HOST || 'localhost';
    status = { message: 'not updated yet', statusCode: 500 };
    info = {};
    containers: any[] = [];
    services: any[] = [];
    nodes: any[] = [];
    workers: any[] = ['abc'];

    constructor(interval: number) {
        this.start_updates(interval);
    }

    private start_updates(interval: number) {
        this.update_status(interval);
        this.update_info(interval);
        this.update_containers(interval);
        this.update_services(interval);
        this.update_nodes(interval);
        this.update_workers(interval);
    };

    private update_status(interval: number) {
        const req = this.client.get('http://' + this.docker_host + ':4444/status', (data: any, response: any) => {
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

    private update_info(interval: number) {
        const req = this.client.get('http://' + this.docker_host + ':4444/info/remote', (data: any, response: any) => {
            this.info = data;
            setTimeout(() => this.update_info(interval), interval);
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_info(interval), interval);
        });
    };

    private update_containers(interval: any) {
        const req = this.client.get('http://' + this.docker_host + ':4444/containers/remote', (data: any, response: any) => {
            this.containers = data;
            setTimeout(() => this.update_containers(interval), interval);
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_containers(interval), interval);
        });
    };

    private update_services(interval: any) {
        const req = this.client.get('http://' + this.docker_host + ':4444/services', (data: any, response: any) => {
            this.services = data;
            setTimeout(() => this.update_services(interval), interval);
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_services(interval), interval);
        });
    };

    private update_nodes(interval: any) {
        const req = this.client.get('http://' + this.docker_host + ':4444/nodes', (data: any, response: any) => {
            this.nodes = data;
            setTimeout(() => this.update_nodes(interval), interval);
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_nodes(interval), interval);
        });
    };

    private update_workers(interval: any) {
        const req = this.client.get('http://' + this.docker_host + ':4444/workers', (data: any, response: any) => {
            this.workers = data;
            setTimeout(() => this.update_workers(interval), interval);
        });

        req.on('error', (error: any) => {
            setTimeout(() => this.update_workers(interval), interval);
        });
    };

    check_status(): Promise<any> {
        return new Promise<any>((resolve, reject) => {
            if (this.status.statusCode === 200) {
                resolve(this.status.message);
            } else {
                reject(this.status.message);
            }
        });
    };

    get_remote_info() {
        return new Promise<any>(resolve => resolve(this.info));
    };

    get_remote_containers() {
        return new Promise<any>(resolve => resolve(this.containers));
    };

    get_remote_services() {
        return new Promise<any>(resolve => resolve(this.services));
    };

    get_nodes = function () {
        return new Promise<any>(resolve => resolve(this.nodes));
    };

    get_workers = function () {
        return new Promise<any>(resolve => resolve(this.workers));
    };

    set_node_availability = function (hostname: any, availability: any) {
        return new Promise<any>((resolve, reject) => {
            const req = this.client.post('http://' + this.docker_host + ':4444/node/' + hostname + '/' + availability,
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error: ' + data);
                    }
                });

            req.on('error', (error: any) => {
                reject('error: ' + error);
            });
        });
    };

    delete_workers = function () {
        return new Promise<any>((resolve, reject) => {
            const req = this.client.delete('http://' + this.docker_host + ':4444/services/workers',
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error: ' + data);
                    }
                });

            req.on('error', (error: any) => {
                reject('error: ' + error);
            });
        });
    };

    create_workers = function () {
        return new Promise<any>((resolve, reject) => {
            const req = this.client.post('http://' + this.docker_host + ':4444/services/workers',
                (data: any, response: any) => {
                    if (response.statusCode === 200) {
                        resolve(data);
                    } else {
                        reject('Error:' + data);
                    }
                });

            req.on('error', (error: any) => {
                reject('Error: ' + error);
            });
        });
    };
}
