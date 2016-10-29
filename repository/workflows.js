/*jshint esversion: 6 */

var redis = require("redis"),
    client = redis.createClient(6379, process.env.REDIS_HOST);
var uuid = require('node-uuid');

to_list = function(element_string) {
    return element_string.split(',').map((e) => e.trim());
};

create_workflow = function(workflow, callback) {
    workflow.id = uuid.v1();
    workflow.created = (new Date()).toJSON();
    workflow.status = "Enabled";
    workflow.todo_nodes = [];
    workflow.busy_nodes = [];
    workflow.done_nodes = [];

    // Set all nodes in TODO
    if (workflow.nodes && workflow.nodes.length > 0) {
        workflow.todo_nodes = to_list(workflow.nodes);
    }

    // Set the object in the new hash
    client.set(workflow.id, JSON.stringify(workflow), function (err, res) {
        if (err) {
            console.log("Error setting workflow for id: " + workflow.id);
            console.dir(err);
            callback(null);
        }

        client.sadd("workflows", workflow.id);

        client.publish("workflows", "CREATED " + workflow.id);

        // Give the REDIS-object back
        get_workflow(workflow.id, callback);
    });
};

update_workflow = function(workflow, callback) {
    client.set(workflow.id, JSON.stringify(workflow), function (err, res) {
        if (err) {
            console.log("Error setting workflow for id: " + workflow.id);
            console.dir(err);
            callback(null);
        }

        client.publish("workflows", "UPDATED " + workflow.id);

        // Give the REDIS-object back
        get_workflow(workflow.id, callback);
    });
};

get_all_workflows = function(callback) {
    client.smembers("workflows", function(err, workflows) {
        output_workflows = [];
        if (workflows.length === 0) callback(err, output_workflows);

        count = 0;
        workflows.forEach(function(element) {
            get_workflow(element, function(err, obj) {
                output_workflows.push(obj);
                count++;

                // Callback when we're done
                if (count == workflows.length) callback(err, output_workflows);
            });
        }, this);
    });
};

get_workflow = function(id, callback) {
    client.get(id, function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err, null);
        } else {
            callback(null, JSON.parse(obj));
        }
    });
};

delete_workflow = function(id, callback) {
    client.del(id, function (err, obj) {
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

exports.create_workflow = create_workflow;
exports.update_workflow = update_workflow;
exports.delete_workflow = delete_workflow;
exports.get_workflow = get_workflow;
exports.get_all_workflows = get_all_workflows;