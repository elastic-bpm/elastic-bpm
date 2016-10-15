var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

get_event = function (req, res) {
    res.setHeader('Content-Type', 'application/json'); 
    res.send({
        time: (new Date()).toJSON(),
        message: "Event message",
    }); 
};

// ROUTING
setup_routes = function() {
   app.get('/event', get_event);
};

// Server startup
start_server = function() {
    app.listen(3000, function () {
        console.log('Elastic-dashboard listening on port 3000!');
    });
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}
