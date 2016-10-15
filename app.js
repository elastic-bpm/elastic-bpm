var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());
app.use(express.static('public'));

// ROUTING
setup_routes = function() {
  /* no routes yet */
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
