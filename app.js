var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());
app.use(express.static('public'));


// GET logic
get_timeline = function (req, res) {
    res.sendFile(__dirname + '/public/parts/timeline.html');
};

// ROUTING
setup_routes = function() {
  app.get('/timeline', get_timeline);
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
