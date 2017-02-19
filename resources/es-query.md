#Get latest load message

```
curl -XGET "http://elasticsearch:9200/_search" -d'
{
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
}'
```

#And per hostname:
```
curl -XGET "http://elasticsearch:9200/_search" -d'
{
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
              "query": "node-02",
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
}'
```
