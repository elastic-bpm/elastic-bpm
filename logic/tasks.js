/*jshint esversion: 6 */

var workflow_repository = require('../repository/workflows');

to_list = function(element_string) {
    return element_string.split(',').map((e) => e.trim());
};

get_task = function (cb) {
    workflow_repository.get_all_workflows((err, workflows) => {
        if (err) {
            cb(err, null);
        }

        todo_tasks = [];
        workflows.forEach((workflow) => {
            nodes = to_list(workflow.nodes);
            done_nodes = to_list(workflow.done_nodes);
            busy_nodes = to_list(workflow.busy_nodes);
            todo_tasks = nodes.map((node) => {
                return {
                    workflow_id: workflow.id,
                    node: node.trim()
                };
            });
        });

        if (todo_tasks.length <= 0) {
            cb("No more tasks", null);     
        } else {
            cb(null, todo_tasks[0]);     
        }

    });

};

exports.get_task = get_task;