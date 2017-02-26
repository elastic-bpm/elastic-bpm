/*jshint esversion: 6 */

var express = require('express'),
    app = express();
var server = require('http').createServer(app);

var workflows = require('./components/workflows');
var redis = require('./components/redis');
var docker = require('./components/docker');
var human = require('./components/human');
var scaling = require('./components/scaling');
var scheduler = require('./components/scheduler');

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

return_status = function(check, req, res) {
    let status = check();
    res.setHeader('Content-Type', 'application/json');
    res.status(status.statusCode).send(status.message);
};

// ROUTING
setup_routes = function() {
   app.get('/api/redis/status', (req, res) => return_status(redis.check_status, req, res));
   app.get('/api/workflow/status', (req, res) => return_status(workflows.check_status, req, res));
   app.get('/api/docker/status', (req, res) => return_status(docker.check_status, req, res));
   app.get('/api/human/status', (req, res) => return_status(human.check_status, req, res));
   app.get('/api/scaling/status', (req, res) => return_status(scaling.check_status, req, res));
   app.get('/api/scheduler/status', (req, res) => return_status(scheduler.check_status, req, res));
};

start_check_status = function() {
    workflows.update_status(2000);
    redis.update_status(2000);
    docker.update_status(2000);
    human.update_status(2000);
    scaling.update_status(2000);
    scheduler.update_status(2000);
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
