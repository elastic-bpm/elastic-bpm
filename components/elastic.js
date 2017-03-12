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
    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    var machineLoad = {
        'node-01': {
            load1: [0.7, 0.8, 2],
            load5: [0.7, 0.8, 1],
            load15: [0.7, 0.8, 1]
        }
    };

    component.start_updates = function (interval) {
        update_status(interval);
        update_messages(interval);
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

    component.get_load = function() {
        return machineLoad;
    }

    return component;
}());

exports.start_updates = elastic_component.start_updates;
exports.check_status = elastic_component.check_status;
exports.get_messages = elastic_component.get_messages;
exports.get_load = elastic_component.get_load;