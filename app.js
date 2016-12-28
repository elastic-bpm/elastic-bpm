var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

// ROUTING
setup_routes = function() {
    app.get('/status', function(req, res) {
        res.send("ok");
    });
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