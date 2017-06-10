import * as elasticsearch from 'elasticsearch';

export class Elastic {
    elastic_host = process.env.ELASTIC_HOST || 'localhost';
    elastic_port = process.env.ELASTIC_API_PORT || 9200;

    client = new elasticsearch.Client({
        host: this.elastic_host + ':' + this.elastic_port,
        log: 'info'
    });

    startTime = new Date().getTime(); // NOW

    component: any = {};
    messages: any[] = [];
    rawLoad: any[] = [];
    maxLoadLength = 10;

    status: any = {
        message: 'not updated yet',
        statusCode: 500
    };
    machineLoad: any = {};

    constructor(interval: number) {
        this.start_updates(interval);
    }

    private start_updates(interval: number) {
        this.update_status(interval);
        this.update_messages(interval);
        this.update_load(interval);
    }

    private update_load(interval: number) {
        let from = this.startTime;
        if (this.rawLoad.length > 0) {
            from = new Date(this.rawLoad[0]['@timestamp']).getTime();
        }

        const query = {
            index: 'metricbeat-*',
            body: {
                'query': {
                    'bool': {
                        'must': [
                            {
                                'query_string': {
                                    'analyze_wildcard': true,
                                    'query': '*'
                                }
                            },
                            {
                                'match': {
                                    'metricset.name': {
                                        'query': 'load',
                                        'type': 'phrase'
                                    }
                                }
                            },
                            {
                                'range': {
                                    '@timestamp': {
                                        'gt': from,
                                        'format': 'epoch_millis'
                                    }
                                }
                            }
                        ],
                        'must_not': []
                    }
                }
            }
        };

        this.client.search(query)
            .then((response) => {
                const newLoad: any[] = [];

                response.hits.hits.forEach((hit: any) => {
                    newLoad.push(hit._source);
                    newLoad.sort(function (a: any, b: any) {
                        if (a['@timestamp'] < b['@timestamp']) {
                            return -1;
                        } else {
                            return 1;
                        }
                    });
                    newLoad.forEach((load: any) => {
                        if (Object.keys(this.machineLoad).indexOf(load.beat.hostname) !== -1) {
                            this.machineLoad[load.beat.hostname].load1.push(load.system.load['1']);
                            if (this.machineLoad[load.beat.hostname].load1.length > this.maxLoadLength) {
                                this.machineLoad[load.beat.hostname].load1 = this.machineLoad[load.beat.hostname].load1.slice(1);
                            }

                            this.machineLoad[load.beat.hostname].load5.push(load.system.load['5']);
                            if (this.machineLoad[load.beat.hostname].load5.length > this.maxLoadLength) {
                                this.machineLoad[load.beat.hostname].load5 = this.machineLoad[load.beat.hostname].load5.slice(1);
                            }

                            this.machineLoad[load.beat.hostname].load15.push(load.system.load['15']);
                            if (this.machineLoad[load.beat.hostname].load15.length > this.maxLoadLength) {
                                this.machineLoad[load.beat.hostname].load15 = this.machineLoad[load.beat.hostname].load15.slice(1);
                            }
                        } else {
                            this.machineLoad[load.beat.hostname] = {
                                load1: [load.system.load['1']],
                                load5: [load.system.load['5']],
                                load15: [load.system.load['15']],
                            };
                        }
                    });

                    if (newLoad.length > 0) {
                        this.rawLoad = newLoad;
                    }
                });

                setTimeout(() => { this.update_load(interval); }, interval);
            }, (err) => {
                console.log(err.message);
            });
    }

    private update_messages(interval: number) {
        let from = this.startTime;
        if (this.messages.length > 0) {
            from = new Date(this.messages[0]['@timestamp']).getTime();
        }

        const query = {
            index: 'logstash-*',
            scroll: '30s',
            body: {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: '*',
                                analyze_wildcard: true
                            }
                        }, {
                            range: {
                                '@timestamp': {
                                    gt: from,
                                    format: 'epoch_millis'
                                }
                            }
                        }]
                    }
                }
            }
        };

        this.client.search(query)
            .then((response) => {
                const newMessages: any[] = [];

                response.hits.hits.forEach((hit: any) => {
                    newMessages.push(hit._source);
                });
                newMessages.sort((a: any, b: any) => {
                    if (a['@timestamp'] < b['@timestamp']) {
                        return 1;
                    } else {
                        return -1;
                    }
                });

                this.messages = newMessages.concat(this.messages);
                this.messages = this.messages.slice(0, 100);

                setTimeout(() => { this.update_messages(interval); }, interval);
            }, (err) => {
                console.log(err.message);
            });
    }

    private update_status(interval: number) {
        this.client.ping({
            // ping usually has a 3000ms timeout
            requestTimeout: 1000
        }, (error: any) => {
            if (error) {
                this.status = {
                    message: 'ELK Down',
                    statusCode: 400
                };
                setTimeout(() => this.update_status(interval), interval);
            } else {
                this.status = {
                    message: 'OK',
                    statusCode: 200
                };
                setTimeout(() => this.update_status(interval), interval);
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

    get_messages(): Promise<any[]> {
        return new Promise<any[]>(resolve => resolve(this.messages));
    }

    get_load(): Promise<any[]> {
        return new Promise<any>(resolve => resolve(this.machineLoad));
    }
}
