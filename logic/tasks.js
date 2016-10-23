/*jshint esversion: 6 */

var workflow_repository = require('../repository/workflows');

get_task = function (cb) {
    workflow_repository.get_all_workflows((err, workflows) => {
        if (err) {
            cb(err, null);
        }

        todo_tasks = [];
        workflows.forEach((workflow) => {
            nodes = workflow.nodes.split(',');
            nodes.forEach((node) => todo_tasks.push({
                workflow_id: workflow.id,
                node: node.trim() 
            }));
        });

        if (todo_tasks.length <= 0) {
            cb("No more tasks", null);     
        } else {
            cb(null, todo_tasks[0]);     
        }

    });

};

exports.get_task = get_task;