/*jshint esversion: 6 */

human_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var component = {};
    var human_host = process.env.HUMAN_HOST || 'localhost';
    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    var info = {};

    component.start_updates = function(interval) {
        update_status(interval);
        update_info(interval);

    };

    update_info = function(interval) {
        var req = client.get("http://" + human_host + ":5555/info", (data, response) => {
            info = data;
            setTimeout(() => update_info(interval), interval);
        });

        req.on('error', (error) => {
            status.statusCode = 500;
            status.message = error.code;
            
            setTimeout(() => update_info(interval), interval);
        });

    };

    update_status = function(interval) {
        var req = client.get("http://" + human_host + ":5555/status", (data, response) => {
            status.statusCode = response.statusCode;
            status.message = response.statusMessage;

            setTimeout(() => update_status(interval), interval);
        });

        req.on('error', (error) => {
            status.statusCode = 500;
            status.message = error.code;
            
            setTimeout(() => update_status(interval), interval);
        });
    };

    component.check_status = function() {
        return status;
    };

    component.get_info = function() {
        return info;
    };

    component.start_humans = function(body, cb) {
        var args = {
            data: body,
            headers: { "Content-Type": "application/json" }
        };
        var req = client.post("http://" + human_host + ":5555/start", args, (data, response) => {
            cb(null, data);
        });

        req.on('error', (error) => {
            cb(error, null);
        });
    }

    component.stop_humans = function(body, cb) {
        var req = client.post("http://" + human_host + ":5555/stop", (data, response) => {
            cb(null, data);
        });

        req.on('error', (error) => {
            cb(error, null);
        });
    }

    return component;
}());

exports.check_status = human_component.check_status;
exports.get_info = human_component.get_info;
exports.start_updates = human_component.start_updates;
exports.start_humans = human_component.start_humans;
exports.stop_humans = human_component.stop_humans;