/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

var host = process.env.SCHEDULER || "localhost";

var args = {
    requestConfig: {
        timeout: 1000, //request timeout in milliseconds 
        noDelay: true, //Enable/disable the Nagle algorithm 
        keepAlive: true, //Enable/disable keep-alive functionalityidle socket. 
        keepAliveDelay: 1000 //and optionally set the initial delay before the first keepalive probe is sent 
    },
    responseConfig: {
        timeout: 1000 //response timeout 
    }
};

get_next_task = function(callback) {
    req = client.get("http://"+host+":3210/task/human", args, function (task, response) {
        if (response.statusCode === 200) {
            callback(null, task);
        } else {
            callback("ignore", null);
        }
    });

    req.on('error', function (err) {
        callback(err, null);
    });
};

flag_task_done = function(task, callback) {
    url = "http://"+host+":3210/task/"+task.workflow_id+'/'+task.task_id;
    req = client.post(url, args, function (body, response) {
        if (response.statusCode === 200) {
            callback(null, body);
        } else {
            callback("ignore", null);
        }
    });

    req.on('error', function (err) {
        callback(err, null);
    });
};

exports.get_next_task = get_next_task;
exports.flag_task_done = flag_task_done;