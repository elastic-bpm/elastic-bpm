/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var listener = require('./listener/listener');
var elastic_api = require('./api/elastic-api');
    
app.use(bodyParser.json());
app.use(express.static('public'));

var num_events = 0;
var events = [];
send_event = function (event) {
    num_events++;
    events.push(event);
    io.emit('event', event);
};

// Send new connections EVERYTHING... muhahaha
io.on('connect', (socket) => {
    events.forEach((event) => {
        socket.emit('event', event);
    });
});


redis_status = {
    name: "Redis",
    status: 0,
    message: "Not connected"
};

elastic_api_status = {
    name: "elastic-api",
    status: 0,
    message: "Not connected"
};

start_check_status = function() {
    listener.connect_client(
        () => {
            redis_status.status = 500;
            redis_status.message = "Error connecting to Redis";
        },
        () => {
            redis_status.status = 200;
            redis_status.message = "Connected to Redis";
        } 
    );

    elastic_api.check_status(
        (err) => {
            elastic_api_status.status = 500;
            elastic_api_status.message = "Error:" + err;
        },
        () => {
            elastic_api_status.status = 200;
            elastic_api_status.message = "Connected to elastic-api";
        }
    );
    // Check other components here
};

get_status = function(req, res) {
    status_data = [
        redis_status,
        elastic_api_status
    ];
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(status_data, null, 3));
};

// ROUTING
setup_routes = function() {
   app.get('/status', get_status);
};

// Emit events
start_casting = function () {
    listener.register_events(send_event);
};

// Server startup
start_server = function() {
    server.listen(8080, () => console.log('Elastic-dashboard listening on port 8080!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_check_status();
    start_casting();
}
