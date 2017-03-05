/*jshint esversion: 6 */

var express = require('express'),
    app = express();

var bodyParser = require('body-parser');
app.use(bodyParser.json());

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

return_json = function(getObject, req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(getObject(), null, 2));
}

return_json_post = function(postObject, req, res) {
    res.setHeader('Content-Type', 'application/json');
    postObject(req.body, (error, data) => {
        if (error) {
            res.status(500).send(error);
        } else {
            res.send(JSON.stringify(data, null, 2));
        };
    });
}

// ROUTING
setup_routes = function() {
   app.get('/api/redis/status', (req, res) => return_status(redis.check_status, req, res));
   app.get('/api/workflow/status', (req, res) => return_status(workflows.check_status, req, res));
   
   app.get('/api/docker/status', (req, res) => return_status(docker.check_status, req, res));
   app.get('/api/docker/info/remote', (req, res) => return_json(docker.get_remote_info, req, res));
   app.get('/api/docker/containers/remote', (req, res) => return_json(docker.get_remote_containers, req, res));
   app.get('/api/docker/services/remote', (req, res) => return_json(docker.get_remote_services, req, res));
   app.get('/api/docker/nodes', (req, res) => return_json(docker.get_nodes, req, res));
   app.get('/api/docker/workers', (req, res) => return_json(docker.get_workers, req, res));

   app.get('/api/human/status', (req, res) => return_status(human.check_status, req, res));
   app.get('/api/human/info', (req, res) => return_json(human.get_info, req, res));
   app.post('/api/human/start', (req, res) => return_json_post(human.start_humans, req, res));
   app.post('/api/human/stop', (req, res) => return_json_post(human.stop_humans, req, res));
   
   app.get('/api/scaling/status', (req, res) => return_status(scaling.check_status, req, res));
   app.get('/api/scaling/virtualmachines', (req, res) => return_json(scaling.get_virtualmachines, req, res));

   app.get('/api/scheduler/status', (req, res) => return_status(scheduler.check_status, req, res));
};

start_check_status = function() {
    workflows.update_status(2000);
    redis.update_status(2000);
    
    docker.start_updates(2000);
    human.start_updates(2000);
    scaling.start_updates(2000);
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
