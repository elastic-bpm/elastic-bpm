/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

var host = process.env.API || "localhost";

get_all_workflows = function(callback) {
    client.get("http://"+host+":3000/workflows", function (data, response) {
        callback(data);
    });
};

get_previous_tasks = function(task, edges_string) {
    previous_tasks = [];

    edge_words = edges_string.split(",").map(w => w.trim());
    edge_words.forEach((word) => {
        elements = word.split("->").map(w => w.trim());
        if (task === elements[1])
        {
            previous_tasks.push(elements[0]);
        }
    });

    return previous_tasks;
};

task_is_free = function(task, workflow) {
    previous_tasks = get_previous_tasks(task, workflow.edges);
    task_free = true;

    previous_tasks.forEach((task) => {
        if (workflow.done_nodes.indexOf(task) < 0) {
            task_free = false;
        }
    });

    return task_free;
};

get_all_free_tasks = function(callback) {
    get_all_tasks(callback, task_is_free);
};

get_all_tasks = function(callback, filter) {
    get_all_workflows((workflows) => {
        tasks = [];

        workflows.forEach((workflow) => {
            workflow.todo_nodes.forEach((node) => {
                if (filter === undefined || filter(node, workflow)) {
                    tasks.push({
                        task_id: node,
                        workflow_id: workflow.id
                    });
                }
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
exports.get_all_free_tasks = get_all_free_tasks;
exports.mark_task_busy = mark_task_busy;
exports.mark_task_done = mark_task_done;