/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var listener = require('./listener/listener');
    
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

get_status = function(req, res) {
    status_data = [
        {
            message: "Redis: ok"
        },
        {
            message: "API: ok"
        }

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
    //send_event(generate_event());
    //setTimeout(start_casting, 20000);
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
    start_casting();
}
