/*jshint esversion: 6 */

var express = require('express'),
    app = express();
var server = require('http').createServer(app);

var workflows = require('./components/workflows');
var redis = require('./components/redis');

const os = require('os');
var log4js = require('log4js');
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": "137.116.195.67",
            "port": 12201,
            "type": "gelf",
            "hostname": "elastic-dashboard-api@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

get_workflow_status = function(req, res) {
    let status = workflows.check_status();

    res.setHeader('Content-Type', 'application/json');
    res.status(status.statusCode).send(status);
};

get_redis_status = function(req, res) {
    let status = redis.check_status();

    res.setHeader('Content-Type', 'application/json');
    res.status(status.statusCode).send(status);
}

// ROUTING
setup_routes = function() {
   app.get('/api/redis/status', get_redis_status);
   app.get('/api/workflow/status', get_workflow_status);
};

start_check_status = function() {
    // nothing yet
    workflows.update_status(2000);
    redis.update_status(2000);
};

// Server startup
start_server = function() {
    server.listen(8080, () => console.log('Elastic-dashboard-api listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_check_status();
}
