/*jshint esversion: 6 */

var task_repository = require('../repositories/tasks');
var moment = require('moment');
var stats_module = (function (task_repository, moment) {
	var my = {}; // public module
    var task_start = {};
    var task_done = {};
    var max_timeout_seconds = 600; // 10 mins for production

    my.mark_task_done = function(task) {
        task_done[JSON.stringify(task)] = moment().format();
    };

    my.mark_task_start = function(task) {
        task_start[JSON.stringify(task)] = moment().format();
    };

    var print_stats = function() {
        var ntasks_start = Object.keys(task_start).length;
        var ntasks_done = Object.keys(task_done).length;

        task_repository.get_all_workflows((err, workflows) => {
            if (err) {
                console.log("Error getting workflows: " + err);
            } else {
                // Do something with the workflows!
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