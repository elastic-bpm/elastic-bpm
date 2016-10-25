/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

var host = process.env.API || "localhost";

get_all_tasks = function(callback) {
    tasks = [];

    client.get("http://"+host+":3000/workflows", function (data, response) {
        data.forEach((workflow) => {
            workflow.todo_nodes.forEach((node) => {
                tasks.push({
                    task_id: node,
                    workflow_id: workflow.id
                });
            });
        });

        callback(tasks);
    });
};

remove_from_array = function(array, item) {
    index = array.indexOf(item);
    if (index > -1) {
        array.splice(index, 1);
    }
    return array;
};

mark_task_busy = function(task, callback) {
    client.get("http://"+host+":3000/workflows/" + task.workflow_id, function (workflow, response) {
        workflow.todo_nodes = remove_from_array(workflow.todo_nodes, task.task_id);
        workflow.busy_nodes.push(task.task_id);

        var args = {
            data: workflow,
            headers: { "Content-Type": "application/json" }
        };
        client.patch("http://"+host+":3000/workflows/" + task.workflow_id, args, function (data, response) {
            callback();
        });
    });
};

mark_task_done = function(task, callback) {
    client.get("http://"+host+":3000/workflows/" + task.workflow_id, function (workflow, response) {
        if (!workflow || workflow === undefined) {
            callback("Workflow with id " + task.workflow_id + " not found.");
            return;
        }

        if (workflow.busy_nodes.indexOf(task.task_id) > -1) {
            workflow.busy_nodes = remove_from_array(workflow.busy_nodes, task.task_id);
            workflow.done_nodes.push(task.task_id);

            var args = {
                data: workflow,
                headers: { "Content-Type": "application/json" }
            };
            client.patch("http://"+host+":3000/workflows/" + task.workflow_id, args, function (data, response) {
                callback();
                return;
            });
        } else {
            callback("Task with id " + task.task_id + " not found in workflow with id " + task.workflow_id);
            return;
        }
    });
};


exports.get_all_tasks = get_all_tasks;
exports.mark_task_busy = mark_task_busy;
exports.mark_task_done = mark_task_done;