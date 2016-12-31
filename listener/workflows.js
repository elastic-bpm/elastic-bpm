/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

var host = process.env.SCHEDULER || "localhost";

get_next_task = function(callback) {
    req = client.get("http://"+host+":3210/task/human", function (task, response) {
        if (response.statusCode === 200) {
            callback(null, task);
        } else {
            callback(null, null);
        }
    });

    req.on('error', function (err) {
        callback(err, null);
    });
};

flag_task_done = function(task, callback) {
    url = "http://"+host+":3210/task/"+task.workflow_id+'/'+task.task_id;
    req = client.post(url, function (task, response) {
        if (response.statusCode === 200) {
            callback(null, task);
        } else {
            callback(task, null);
        }
    });

    req.on('error', function (err) {
        callback(err, null);
    });
};

exports.get_next_task = get_next_task;
exports.flag_task_done = flag_task_done;