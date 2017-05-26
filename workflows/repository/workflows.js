/*jshint esversion: 6 */

const redis_host = process.env.REDIS_HOST || 'localhost';
var redis = require("redis"),
    client = redis.createClient(6379, redis_host);
var uuid = require('node-uuid');

wf_to_list = function(element_string) {
    return element_string.split(',').map((e) => e.trim());
};

wf_create_workflow = function(workflow, callback) {
    workflow.id = uuid.v1();
    workflow.created = (new Date()).toJSON();
    workflow.status = "Created";
    workflow.todo_nodes = [];
    workflow.busy_nodes = [];
    workflow.done_nodes = [];

    // Set all nodes in TODO
    if (workflow.nodes && workflow.nodes.length > 0) {
        workflow.todo_nodes = wf_to_list(workflow.nodes);
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

        console.log("workflow:created " + workflow.id + " at " + workflow.created);

        // Give the REDIS-object back
        wf_get_workflow(workflow.id, callback);
    });
};


wf_create_multiple_workflows = function(workflows, callback) {
    workflows.forEach((workflow) => {
        if (workflow.delay) {
            // Fire & forget with delayed workflows...
            setTimeout(() => wf_create_workflow(workflow, () => {}), workflow.delay);
        } else {
            wf_create_workflow(workflow, (error, data) => {
                if (error) {
                    callback(error, null);
                }
            });
        }
    });

    callback(null, 'ok');
};

wf_update_workflow = function(workflow, callback) {
    if (workflow.busy_nodes.length > 0) {
        workflow.status = "Busy";
    } else if (workflow.todo_nodes.length === 0) {
        workflow.status = "Done";
        workflow.done = (new Date()).toJSON();
        console.log("workflow:done " + workflow.id + " at " + workflow.done);
        console.log("workflow:stats " + workflow.id + " " + workflow.type + " " + JSON.stringify(workflow))
    } else {
        workflow.status = "Waiting";
    }

    client.set(workflow.id, JSON.stringify(workflow), function (err, res) {
        if (err) {
            console.log("Error setting workflow for id: " + workflow.id);
            console.dir(err);
            callback(null);
        }

        client.publish("workflows", "UPDATED " + workflow.id);

        // Give the REDIS-object back
        wf_get_workflow(workflow.id, callback);
    });
};

wf_get_all_workflows = function(callback) {
    client.smembers("workflows", function(err, workflows) {
        output_workflows = [];
        if (workflows.length === 0) callback(err, output_workflows);

        count = 0;
        workflows.forEach(function(element) {
            wf_get_workflow(element, function(err, obj) {
                output_workflows.push(obj);
                count++;

                // Callback when we're done
                if (count == workflows.length) callback(err, output_workflows);
            });
        }, this);
    });
};

wf_get_workflow = function(id, callback) {
    client.get(id, function (err, obj) {
        if (err) {
            console.dir(err);
            callback(err, null);
        } else {
            callback(null, JSON.parse(obj));
        }
    });
};

wf_delete_workflow = function(id, callback) {
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

wf_delete_all_workflows = function(callback) {
    wf_get_all_workflows((err, workflows) => {
        if (err) {
            callback(err, null);
        } else {
            workflows.forEach((wf) => {
                wf_delete_workflow(wf.id, () => {});
            });
            callback(null, null);
        }
    });
};

exports.create_workflow = wf_create_workflow;
exports.create_multiple_workflows = wf_create_multiple_workflows;
exports.update_workflow = wf_update_workflow;
exports.delete_workflow = wf_delete_workflow;
exports.get_workflow = wf_get_workflow;
exports.get_all_workflows = wf_get_all_workflows;
exports.delete_all_workflows = wf_delete_all_workflows;