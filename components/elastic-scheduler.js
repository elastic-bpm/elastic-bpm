/*jshint esversion: 6 */

elastic_scheduler_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var host = process.env.SCHEDULER_HOST;
	var es = {};

	es.check_status = function (err, ready) {
        var req = client.get("http://" + host + ":3210/status", (data, response) => {
            if (response.statusCode == 200) {
                ready();
            } else {
                err(response.statusCode, "");
            }
        });

        req.on('error', (error) => {
            err(500,'' + error, null);
        });

        setTimeout(() => es.check_status(err, ready), 2000);
	};

    es.get_free_human_tasks = function(callback) {
        var req = client.get("http://" + host + ":3210/tasks/human", (data, response) => {
            if (response.statusCode == 200) {
                callback(null, data);
            } else {
                callback("Error: " + data, null);
            }
        });

        req.on('error', (error) => {
            callback('' + error, null);
        });
    };

    es.mark_task_busy = function(task, callback) {
        var req = client.post("http://" + host + ":3210/task/"+task.workflow_id+"/"+task.task_id+"/busy", (data, response) => {
            if (response.statusCode == 200) {
                callback();
            } else {
                callback("Error: " + data);
            }
        });

        req.on('error', (error) => {
            callback('' + error);
        });
    };

    es.mark_task_done = function(task, callback) {
        var req = client.post("http://" + host + ":3210/task/"+task.workflow_id+"/"+task.task_id, (data, response) => {
            if (response.statusCode == 200) {
                callback();
            } else {
                callback("Error: " + data);
            }
        });

        req.on('error', (error) => {
            callback('' + error);
        });
    };

	return es;
}());

exports.check_status = elastic_scheduler_component.check_status;
exports.get_free_human_tasks = elastic_scheduler_component.get_free_human_tasks;
exports.mark_task_busy = elastic_scheduler_component.mark_task_busy;
exports.mark_task_done = elastic_scheduler_component.mark_task_done;