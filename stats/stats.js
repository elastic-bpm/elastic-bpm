/*jshint esversion: 6 */

var task_repository = require('../repositories/tasks');
var moment = require('moment');
var stats_module = (function (task_repository, moment) {
	var my = {}; // public module
    var task_start = {};
    var task_done = {};
    var finished_workflows = [];
    var max_timeout_seconds = 600; // 10 mins for production

    my.mark_task_done = function(task) {
        task_done[JSON.stringify(task)] = moment().toJSON();
    };

    my.mark_task_start = function(task) {
        task_start[JSON.stringify(task)] = moment().toJSON();
    };

    var get_time_from_list = function(task_list, node) {
        var time = -1;
        Object.keys(task_list).forEach(function(key, index) {
            var task = JSON.parse(key);
            if (task.task_id === node) {
                time = task_list[key];
            }
        });
        return time;
    };

    var get_start_time = function(node) {
        return get_time_from_list(task_start, node);
    };

    var get_finish_time = function(node) {
        return get_time_from_list(task_done, node);
    };

    var remove_nodes_from_lists = function(workflow_id) {
        Object.keys(task_done).forEach(function(key, index) {
            var task = JSON.parse(key);
            if (task.workflow_id === workflow_id) {
                delete this[key];
            }
        }, task_done);

        Object.keys(task_start).forEach(function(key, index) {
            var task = JSON.parse(key);
            if (task.workflow_id === workflow_id) {
                delete this[key];
            }
        }, task_start);
    };

    var print_stats = function() {
        var ntasks_start = Object.keys(task_start).length;
        var ntasks_done = Object.keys(task_done).length;

        task_repository.get_all_workflows((err, workflows) => {
            if (err) {
                console.log("Error getting workflows: " + err);
            } else {
                workflows.forEach(function(workflow) {
                    if (workflow.status === "Done" && !finished_workflows.includes(workflow.id)) {
                        var nodes_info = [];
                        var nodes = workflow.nodes.split(",").map((str) => str.trim());
                        nodes.forEach(function(node) {
                            nodes_info.push({
                                node: node,
                                node_created: workflow.created,
                                node_started: get_start_time(node),
                                node_finished: get_finish_time(node)
                            });
                        });

                        finished_workflows.push(workflow.id);
                        remove_nodes_from_lists(workflow.id);
                        console.log("workflow:info " + workflow.id + " " + JSON.stringify(nodes_info));
                    }
                });
            }
        });
    };

	my.check_timeouts = function() {
        print_stats(); // Let's spit out stats as well :-)

        Object.keys(task_start).forEach(function(key, index) {
            if (!task_done.hasOwnProperty(key)) {
                var task_start_time = moment(this[key]);
                console.log(" " + key + " started " + task_start_time.fromNow());
                if (task_start_time.isBefore(moment().subtract(max_timeout_seconds,'seconds'))) {
                    console.log("!!That's a long time ago!! - moving task back to 'todo'");
                    var task = JSON.parse(key);
                    task_repository.mark_task_todo(task, (error) => {
                        if (error) {
                            console.log(error);
                        }

                        delete this[key];
                    });
                }
            }
        }, task_start);
    };

	return my;
}(task_repository, moment));

exports.check_timeouts = stats_module.check_timeouts;
exports.mark_task_start = stats_module.mark_task_start;
exports.mark_task_done = stats_module.mark_task_done;