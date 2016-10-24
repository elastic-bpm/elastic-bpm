/*jshint esversion: 6 */

var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());

// ROUTING
setup_routes = function() {
    app.get('/status', (req, res) => res.send('ok'));
};

// Server startup
start_server = function() {
    app.listen(3210, () => console.log('Elastic Scheduler listening on port 3210!'));
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}