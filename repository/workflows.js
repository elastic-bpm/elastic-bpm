var redis = require("redis"),
    client = redis.createClient();

add_workflow_to_redis = function(workflow, callback) {
    // Generate new id
    client.incr("id:workflows", function(err, id) {
        workflow_id = "workflows:" + id;

        workflow.id = workflow_id;
        workflow.created = (new Date()).toJSON();

        // Set the object in the new hash
        client.hmset(workflow_id, workflow, function (err, res) {
            if (err) {
                console.log("Error setting workflow for id: " + id);
                console.dir(err);
                callback(null);
            }

            client.sadd("workflows", workflow_id);

            // Give the REDIS-object back
            get_workflow_from_redis(workflow_id, callback);
        });
    });
};

get_all_workflows_from_redis = function(callback) {
    client.smembers("workflows", function(err, workflows) {
        //workflows = Array.apply(null, {length: parseInt(id)}).map(Number.call, Number);
        // console.dir(workflows);
        count = 0;

        output_workflows = [];

        workflows.forEach(function(element) {
            // console.dir(element);
            get_workflow_from_redis(element, function(obj) {
                output_workflows.push(obj);
                count++;

                if (count == workflows.length) callback(output_workflows);
            });
        }, this);
    });
};

get_workflow_from_redis = function(id, callback) {
    client.hgetall(id, function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err);
        } else {
            callback(obj);
        }
    });
};

create_workflow = function(workflow, callback) {
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