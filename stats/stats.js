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
            node_info.ready_to_start = workflow.created;

            var previous_tasks = get_previous_tasks(node_info.node, workflow.edges);
            previous_tasks.forEach(function(previous_task) {
                var prev_time = get_finish_time(previous_task, workflow.id);
                if (moment(prev_time).isAfter(moment(node_info.ready_to_start))) {
                    node_info.ready_to_start = prev_time;
                }
            });
        });

        return nodes_info;
    };

    var get_info_for_workflow = function(workflow) {
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

        // Need to first fill the rest, before we can calculate the ready-time
        return fill_ready_time(nodes_info, workflow);
    };

    var get_time_humans_waited = function(nodes_info) {
        // WARNING - overlap in time should be filtered out!!

        return 0;
    };

    var get_first_task_started = function(nodes_info) {
        var start_moments = nodes_info.map((node) => moment(node.started));
        return moment.min(start_moments).toJSON();
    };

    var get_stats_for_workflow = function(workflow, nodes_info) {
        var stats = {};

        var first_task_started = get_first_task_started(nodes_info);

        // All stats are in milliseconds
        stats.makespan = moment(workflow.finished).diff(moment(first_task_started));
        stats.wait_time = moment(first_task_started).diff(moment(workflow.created));
        stats.response_time = stats.makespan + stats.wait_time;
        stats.human_time = get_time_humans_waited(nodes_info);
        stats.system_time = stats.response_time - stats.human_time;

        return stats;
    };

    var print_stats = function() {
        task_repository.get_all_workflows((err, workflows) => {
            if (err) {
                console.log("Error getting workflows: " + err);
            } else {
                workflows.forEach(function(workflow) {
                    if (workflow.status === "Done" && !finished_workflows.includes(workflow.id)) {
                        var nodes_info = get_info_for_workflow(workflow);
                        console.log("workflow:info " + workflow.id + " " + JSON.stringify(nodes_info));

                        var workflow_stats = get_stats_for_workflow(workflow, nodes_info);
                        console.log("workflow:stats " + workflow.id + " " + JSON.stringify(workflow_stats));

                        finished_workflows.push(workflow.id);
                        remove_nodes_from_lists(workflow.id);
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