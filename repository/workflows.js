var redis = require("redis"),
    client = redis.createClient();

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

            client.sadd("workflows", "workflows:" + id);

            // Give the REDIS-object back
            get_workflow_from_redis(id, callback);
        });
    });
};

get_all_workflows_from_redis = function(callback) {
    client.get("id:workflows", function(err, id) {
        workflows = Array.apply(null, {length: parseInt(id)}).map(Number.call, Number);
        count = 0;

        workflows.forEach(function(element) {
            get_workflow_from_redis(element+1, function(obj) {
                workflows[parseInt(element)] = obj;
                count++;

                if (count == parseInt(id)) callback(workflows);
            });
        }, this);
    });
};

get_workflow_from_redis = function(id, callback) {
    client.hgetall("workflows:" + id, function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err);
        } else {
            callback(obj);
        }
    });
};

create_workflow = function(workflow, callback) {
    workflow.created = (new Date()).toJSON();
    add_workflow_to_redis(workflow, callback);    
};

get_workflow = function(id, callback) {
    get_workflow_from_redis(id, callback);
};

get_all_workflows = function(callback) {
    get_all_workflows_from_redis(callback);
};

exports.create_workflow = create_workflow;
exports.get_workflow = get_workflow;
exports.get_all_workflows = get_all_workflows;