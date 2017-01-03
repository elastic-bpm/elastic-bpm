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

    var get_time_from_list = function(task_list, node, workflow_id) {
        var time = -1;
        Object.keys(task_list).forEach(function(key, index) {
            var task = JSON.parse(key);
            if (task.task_id === node && task.workflow_id === workflow_id) {
                time = task_list[key];
            }
        });
        return time;
    };

    var get_start_time = function(node, workflow_id) {
        return get_time_from_list(task_start, node, workflow_id);
    };

    var get_finish_time = function(node, workflow_id) {
        return get_time_from_list(task_done, node, workflow_id);
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

    var get_previous_tasks = function(task, edges_string) {
        previous_tasks = [];

        edge_words = edges_string.split(",").map(w => w.trim());
        edge_words.forEach((word) => {
            elements = word.split("->").map(w => w.trim());
            if (task === elements[1]) {
                previous_tasks.push(elements[0]);
            }
        });

        return previous_tasks;
    };

    var fill_ready_time = function(nodes_info, workflow) {
        nodes_info.forEach(function(node_info) {
            var previous_tasks = get_previous_tasks(node_info.node, workflow.edges);
            console.log("Pevious tasks: " + JSON.stringify(previous_tasks));
            node_info.ready_to_start = workflow.created;

            previous_tasks.forEach(function(previous_task) {
                var prev_time = get_finish_time(previous_task, workflow.id);
                console.log("Found prev_time: " + prev_time);
                if (moment(prev_time).isAfter(moment(node_info.ready_to_start))) {
                    node_info.ready_to_start = prev_time;
                }
            });
        });

        return nodes_info;
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
                                created: workflow.created,
                                started: get_start_time(node, workflow.id),
                                finished: get_finish_time(node, workflow.id)
                            });
                        });
                        nodes_info = fill_ready_time(nodes_info, workflow);

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