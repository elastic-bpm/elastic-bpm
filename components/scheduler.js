/*jshint esversion: 6 */

scheduler_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var scheduler_host = process.env.SCHEDULER_HOST || 'localhost';
    var component = {};
    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    var info = {};

    component.start_updates = function(interval) {
        update_status(interval);
        update_info(interval);
    }

    var update_status = function(interval) {
        var req = client.get("http://" + scheduler_host + ":3210/status", (data, response) => {
            status.statusCode = response.statusCode;
            status.message = response.statusMessage;
            
            setTimeout(() => update_status(interval), interval);
        });

        req.on('error', (error) => {
            status.statusCode = 500;
            status.message = error.code;
            
            setTimeout(() => update_status(interval), interval);
        });
    }

    var update_info = function(interval) {
        var req = client.get("http://" + scheduler_host + ":3210/info", (data, response) => {
            if (response.statusCode == 200) {
                info = data;
                setTimeout(() => update_info(interval), interval);
            } else {
                setTimeout(() => update_info(interval), interval);
            }
        });

        req.on('error', (error) => {
            setTimeout(() => update_info(interval), interval);
        });
    }

    component.set_policy = function(body, cb) {
        console.log(body);
        var req = client.post("http://" + scheduler_host + ":3210/policy/" + body.policy, (data, response) => {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb("Error: " + data, null);
            }
        });

        req.on('error', (error) => {
            cb("Error: " + error, null);
        });
    }

    component.set_amount = function(body, cb) {
        console.log(body);
        var req = client.post("http://" + scheduler_host + ":3210/amount/" + body.policy + "/" + body.amount, (data, response) => {
            if (response.statusCode == 200) {
                cb(null, data);
            } else {
                cb("Error: " + data, null);
            }
        });

        req.on('error', (error) => {
            cb("Error: " + error, null);
        });
    }

    component.check_status = function() {
        return status;
    };

    component.get_info = function() {
        return info;
    }

    return component;
}());

exports.check_status = scheduler_component.check_status;
exports.get_info = scheduler_component.get_info;
exports.start_updates = scheduler_component.start_updates;
exports.set_policy = scheduler_component.set_policy;
exports.set_amount = scheduler_component.set_amount;