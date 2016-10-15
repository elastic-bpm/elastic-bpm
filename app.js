/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
    
app.use(bodyParser.json());
app.use(express.static('public'));

var num_events = 0;
var events = [];
generate_event = function() {
    num_events++;
    event = {
        time: (new Date()).toJSON(),
        message: "Event message " + num_events,
    };
    events.push(event); 
    return event;
};

send_event = function () {
    io.emit('event', generate_event());
};

// Send new connections EVERYTHING... muhahaha
io.on('connect', (socket) => {
    events.forEach((event) => {
        socket.emit('event', event);
    });
});

// ROUTING
setup_routes = function() {
//   app.get('/event', get_event);
};

// Emit events
start_casting = function () {
    send_event();
    setTimeout(start_casting, 2000);
};

// Server startup
start_server = function() {
    server.listen(3000, () => console.log('Elastic-dashboard listening on port 3000!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
    start_casting();
}
