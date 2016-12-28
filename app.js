var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

var active = false;

start_humans = function(on, off, init, total) {
    console.log("On: " + on + ", Off: " + off + ", Init: " + init + ", Total: " + total);
    
    // Start timers!

    // Set flag
    active = true;
};

stop_humans = function() {
    // Turn all timers off

    // Set flag
    active = false;
};

post_start = function(req, res) {
    // Body is parsed to 'req.body'
    //console.log(req.body);

    // If active, first stop the humans
    if (active) {
        stop_humans();
    }

    // Start the humans!
    start_humans(req.body.on, req.body.off, req.body.init, req.body.total);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify('ok', null, 3));
};

post_stop = function (req, res) {
    if (active) {
        stop_humans();
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify('ok', null, 3));
};

// ROUTING
setup_routes = function() {
    app.get('/status', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify('ok', null, 3));
    });

    app.get('/active', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(active, null, 3));
    });

    app.post('/start', post_start);
    app.post('/stop', post_stop);
};

// Server startup
start_server = function() {
    app.listen(5555, function () {
        console.log('Elastic-human listening on port 5555!');
    });
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}