/*jshint esversion: 6 */

var express = require('express'),
    app = express();
var server = require('http').createServer(app);

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

return_data = function(res, error, data) {
    if (error) {
        res.status(500).send(error);
    } else {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(data, null, 3));
    }
};

// ROUTING
setup_routes = function() {
   app.get('/api/redis/status', (req, res) => {return_data(res, null, "ok");});
};

start_check_status = function() {
    // nothing yet
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
