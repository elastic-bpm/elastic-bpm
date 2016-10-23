var redis = require("redis"),
    client = redis.createClient(6379, process.env.REDIS_HOST);
var uuid = require('node-uuid');

add_workflow_to_redis = function(workflow, callback) {
    workflow.id = uuid.v1();
    workflow.created = (new Date()).toJSON();
    workflow.status = "Enabled";
    workflow.state = "A";

    // Set the object in the new hash
    client.hmset(workflow.id, workflow, function (err, res) {
        if (err) {
            console.log("Error setting workflow for id: " + workflow.id);
            console.dir(err);
            callback(null);
        }

        client.sadd("workflows", workflow.id);

        client.publish("workflows", "CREATED " + workflow.id);

        // Give the REDIS-object back
        get_workflow_from_redis(workflow.id, callback);
    });
};

update_workflow_to_redis = function(workflow, callback) {
    client.hmset(workflow.id, workflow, function (err, res) {
        if (err) {
            console.log("Error setting workflow for id: " + workflow.id);
            console.dir(err);
            callback(null);
        }

        client.publish("workflows", "UPDATED " + workflow.id);

        // Give the REDIS-object back
        get_workflow_from_redis(workflow.id, callback);
    });
};

get_all_workflows_from_redis = function(callback) {
    client.smembers("workflows", function(err, workflows) {
        output_workflows = [];
        if (workflows.length === 0) callback(err, output_workflows);

        count = 0;
        workflows.forEach(function(element) {
            get_workflow_from_redis(element, function(err, obj) {
                output_workflows.push(obj);
                count++;

                // Callback when we're done
                if (count == workflows.length) callback(err, output_workflows);
            });
        }, this);
    });
};

get_workflow_from_redis = function(id, callback) {
    client.hgetall(id, function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err, null);
        } else {
            callback(null, obj);
        }
    });
};

delete_workflow = function(id, callback) {
    client.hdel(id, ['id', 'created', 'status','state','name','owner','description'], function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err, null);
        } else {
            client.srem("workflows", id);

            client.publish("workflows", "DELETED " + id);

            callback(null, obj);
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

update_workflow = function(workflow, callback) {
    update_workflow_to_redis(workflow, callback);
};

exports.create_workflow = create_workflow;
exports.update_workflow = update_workflow;
exports.delete_workflow = delete_workflow;
exports.get_workflow = get_workflow;
exports.get_all_workflows = get_all_workflows;