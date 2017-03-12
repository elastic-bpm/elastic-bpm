/*jshint esversion: 6 */

elastic_component = (function () {
    var elastic_host = process.env.ELASTIC_HOST || '137.116.195.67';
    var elasticsearch = require('elasticsearch');
    var client = new elasticsearch.Client({
        host: elastic_host + ':9200'
    });
    var startTime = new Date().getTime(); // NOW

    var component = {};
    var messages = [];
    var rawLoad = [];
    var maxLoadLength = 5;

    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    var machineLoad = {};

    component.start_updates = function (interval) {
        update_status(interval);
        update_messages(interval);
        update_load(interval);
    }

    var update_load = function (interval) {
        var newLoad = [];

        var from = startTime;
        if (rawLoad.length > 0) {
            from = new Date(rawLoad[0]['@timestamp']).getTime();
        }

        var query = {
            index: 'metricbeat-*',
            scroll: '30s',
            body: {
                "query": {
                    "bool": {
                        "must": [
                            {
                                "query_string": {
                                    "analyze_wildcard": true,
                                    "query": "*"
                                }
                            },
                            {
                                "match": {
                                    "metricset.name": {
                                        "query": "load",
                                        "type": "phrase"
                                    }
                                }
                            },
                            {
                                "range": {
                                    "@timestamp": {
                                        "gt": from,
                                        "format": "epoch_millis"
                                    }
                                }
                            }
                        ],
                        "must_not": []
                    }
                }
            }
        };

        client.search(query, function getMoreUntilDone(error, response) {
            if (error) {
                console.log(error);
            } else {
                response.hits.hits.forEach(function (hit) {
                    newLoad.push(hit._source);
                });
                if (response.hits.total > newLoad.length) {
                    client.scroll({
                        scrollId: response._scroll_id,
                        scroll: '30s'
                    }, getMoreUntilDone);
                } else {
                    newLoad.sort(function (a, b) {
                        if (a["@timestamp"] < b["@timestamp"]) {
                            return -1;
                        } else {
                            return 1;
                        }
                    })


                    newLoad.forEach(function(load) {
                        if (Object.keys(machineLoad).indexOf(load.beat.hostname) !== -1) {                            
                            machineLoad[load.beat.hostname].load1.push(load.system.load["1"]);
                            if (machineLoad[load.beat.hostname].load1.length > maxLoadLength) {
                                machineLoad[load.beat.hostname].load1 = machineLoad[load.beat.hostname].load1.slice(1);
                            }

                            machineLoad[load.beat.hostname].load5.push(load.system.load["5"]);
                            if (machineLoad[load.beat.hostname].load5.length > maxLoadLength) {
                                machineLoad[load.beat.hostname].load5 = machineLoad[load.beat.hostname].load5.slice(1);
                            }

                            machineLoad[load.beat.hostname].load15.push(load.system.load["15"]);
                            if (machineLoad[load.beat.hostname].load15.length > maxLoadLength) {
                                machineLoad[load.beat.hostname].load15 = machineLoad[load.beat.hostname].load15.slice(1);
                            }
                        } else {
                            machineLoad[load.beat.hostname] = {
                                load1: [load.system.load["1"]],
                                load5: [load.system.load["5"]],
                                load15: [load.system.load["15"]],
                            }
                        }
                    })

                    if (newLoad.lenth > 0) {
                        rawLoad = newLoad;
                    }

                    setTimeout(() => { update_load(interval) }, interval);
                }
            }
        });
    }

    var update_messages = function (interval) {
        var newMessages = [];

        var from = startTime;
        if (messages.length > 0) {
            from = new Date(messages[0]['@timestamp']).getTime();
        }

        var query = {
            index: 'logstash-*',
            scroll: '30s',
            body: {
                query: {
                    bool: {
                        must: [{
                            query_string: {
                                query: "*",
                                analyze_wildcard: true
                            }
                        }, {
                            range: {
                                "@timestamp": {
                                    gt: from,
                                    format: "epoch_millis"
                                }
                            }
                        }]
                    }
                }
            }
        };

        client.search(query, function getMoreUntilDone(error, response) {
            if (error) {
                console.log(error);
            } else {
                response.hits.hits.forEach(function (hit) {
                    newMessages.push(hit._source);
                });
                if (response.hits.total > newMessages.length) {
                    client.scroll({
                        scrollId: response._scroll_id,
                        scroll: '30s'
                    }, getMoreUntilDone);
                } else {
                    newMessages.sort(function (a, b) {
                        if (a["@timestamp"] < b["@timestamp"]) {
                            return 1;
                        } else {
                            return -1;
                        }
                    })

                    messages = newMessages.concat(messages);
                    messages = messages.slice(0, 100);

                    setTimeout(() => { update_messages(interval) }, interval);
                }
            }
        });
    }

    var update_status = function (interval) {
        client.ping({
            // ping usually has a 3000ms timeout
            requestTimeout: 1000
        }, function (error) {
            if (error) {
                status = {
                    message: "ELK Down",
                    statusCode: 400
                };
                setTimeout(() => update_status(interval), interval);
            } else {
                status = {
                    message: "OK",
                    statusCode: 200
                };
                setTimeout(() => update_status(interval), interval);
            }
        });
    }

    component.check_status = function () {
        return status;
    }

    component.get_messages = function () {
        return messages;
    }

    component.get_load = function () {
        return machineLoad;
    }

    return component;
}());

exports.start_updates = elastic_component.start_updates;
exports.check_status = elastic_component.check_status;
exports.get_messages = elastic_component.get_messages;
exports.get_load = elastic_component.get_load;