import * as elasticsearch from 'elasticsearch';
import RxClient from 'rx-elasticsearch';


export class Elastic {
    elastic_host = process.env.ELASTIC_HOST || '137.116.195.67';
    client = new elasticsearch.Client({
        host: this.elastic_host + ':9200',
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

    start_updates(interval: number) {
        this.update_status(interval);
        this.update_messages(interval);
        this.update_load(interval);
    }

    update_load(interval: number) {
        let from = this.startTime;
        if (this.rawLoad.length > 0) {
            from = new Date(this.rawLoad[0]['@timestamp']).getTime();
        }

        const query = {
            index: 'metricbeat-*',
            scroll: '30s',
            body: {
                query: {
                    bool: {
                        must: [
                            {
                                query_string: {
                                    analyze_wildcard: true,
                                    query: '*'
                                }
                            },
                            {
                                match: {
                                    'metricset.name': {
                                        query: 'load',
                                        type: 'phrase'
                                    }
                                }
                            },
                            {
                                range: {
                                    '@timestamp': {
                                        gt: from,
                                        format: 'epoch_millis'
                                    }
                                }
                            }
                        ],
                        must_not: new Array()
                    }
                }
            }
        };

        const rxClient = new RxClient(this.client);
        rxClient
            .scroll(query)
            .subscribe(
            (response: any) => {
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

                    console.log(newLoad.length);
                    if (newLoad.length > 0) {
                        this.rawLoad = newLoad;
                    }

                    setTimeout(() => { this.update_load(interval); }, interval);
                });
            },
            (e: any) => console.error(e)
            );
    }

    update_messages(interval: number) {
        let from = this.startTime;
        if (this.messages.length > 0) {
            from = new Date(this.messages[0]['@timestamp']).getTime();
        }

        const messagesQuery = {
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

        const rxClient = new RxClient(this.client);
        rxClient
            .scroll(messagesQuery)
            .subscribe(
            (response: any) => {
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
            },
            (e: any) => console.error(e)
            );
    }

    update_status(interval: number) {
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

    check_status() {
        return this.status;
    }

    get_messages() {
        return this.messages;
    }

    get_load() {
        return this.machineLoad;
    }
}
