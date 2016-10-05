var express = require('express'),
    app = express();

var redis = require("redis"),
    client = redis.createClient();

var workflows = [
    {
        name: "wf1", 
        owner: "johannes",
        description: "A -> B -> C"
    },
    {
        name: "wf2", 
        owner: "johannes",
        description: "A -> B -> C"
    },
];

add_workflow_to_redis = function(workflow, callback) {
    // Generate new id
    client.incr("id:workflows", function(err, id) {

        // Set the object in the new hash
        client.hmset("workflows:" + id, workflow, function (err, res) {
            if (err) {
                console.log("Error setting workflow for id: " + id);
                console.dir(err);
                callback(null);
            }

            // Get the REDIS-object back
            client.hgetall("workflows:" + id, function (err, obj) {
                if (err) {
                    console.dir(err);
                    callback(err);
                } else {
                    callback(obj);
                }
            });
        });
    });
};

create_workflow = function(workflow, callback) {
    workflow.created = (new Date()).toJSON();
    add_workflow_to_redis(workflow, callback);    
};

setup_routes = function() {
    app.get('/workflows', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(workflows, null, 3));
    });

    app.post('/workflows', function (req, res) {
        res.setHeader('Content-Type', 'application/json');
        create_workflow(workflows[0], function(wf) { res.send(wf); });
    });
};

start_server = function() {
    app.listen(3000, function () {
        console.log('Example app listening on port 3000!');
    });
};

// When run directly, serving the API
if (require.main === module) {
    setup_routes();
    start_server();
}

exports.create_workflow = create_workflow;