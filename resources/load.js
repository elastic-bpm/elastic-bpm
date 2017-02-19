/*jshint esversion: 6 */

var load_module = (function () {
    var my = {}; // public module
    var Client = require('node-rest-client').Client;
    var client = new Client();

    // TODO: Put query in seperate .JSON file?
    my.get_load = function(hostname, callback) {
        var args = {
            data: {
                "size": 1,
                "sort": [
                    {
                    "@timestamp": {
                        "order": "desc",
                        "unmapped_type": "boolean"
                    }
                    }
                ],
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
                        "match": {
                            "beat.hostname": {
                            "query": hostname,
                            "type": "phrase"
                            }
                        }
                        },
                        {
                        "range": {
                            "@timestamp": {
                            "gt": "now-1w"
                            }
                        }
                        }
                    ],
                    "must_not": []
                    }
                },
                "highlight": {
                    "pre_tags": [
                    "@kibana-highlighted-field@"
                    ],
                    "post_tags": [
                    "@/kibana-highlighted-field@"
                    ],
                    "fields": {
                    "*": {}
                    },
                    "require_field_match": false,
                    "fragment_size": 2147483647
                },
                "_source": {
                    "excludes": []
                },
                "stored_fields": [
                    "*"
                ],
                "script_fields": {},
                "docvalue_fields": [
                    "postgresql.bgwriter.stats_reset",
                    "docker.container.created",
                    "system.process.cpu.start_time",
                    "postgresql.activity.query_start",
                    "@timestamp",
                    "postgresql.activity.state_change",
                    "mongodb.status.local_time",
                    "mongodb.status.background_flushing.last_finished",
                    "postgresql.activity.transaction_start",
                    "postgresql.activity.backend_start",
                    "postgresql.database.stats_reset"
                ]
            },
            headers: { "Content-Type": "application/json" }
        };

        req = client.post("http://137.116.195.67:9200/_search", args, function (data, response) {
            if (response.statusCode == 200) {
                if (data.hits !== null && data.hits.total > 0) {
                    callback(null, data.hits.hits[0]._source);
                } else {
                    console.log("Error while getting load for " + hostname);
                    console.error(data);
                    callback(data);    
                }
            } else {
                console.log("Error while getting load for " + hostname);
                console.error(data);
                callback(data);
            }
        });
        req.on('error', (err) => {
            console.log("Error while getting load for " + hostname);
            console.error(err);
            callback(err);
        });
    };

    return my;
})();

exports.get_load = load_module.get_load;