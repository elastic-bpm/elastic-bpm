/*jshint esversion: 6 */

scheduler_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var scheduler_host = process.env.SCHEDULER_HOST || 'localhost';
    var component = {};
    component.status = {
        message: "not updated yet",
        statusCode: 500
    };

    component.update_status = function(interval) {
        var req = client.get("http://" + scheduler_host + ":3210/status", (data, response) => {
            component.status.statusCode = response.statusCode;
            component.status.message = response.statusMessage;
            
            setTimeout(() => component.update_status(interval), interval);
        });

        req.on('error', (error) => {
            component.status.statusCode = 500;
            component.status.message = error.code;
            
            setTimeout(() => component.update_status(interval), interval);
        });
    }

    component.check_status = function() {
        return component.status;
    };

    return component;
}());

exports.check_status = scheduler_component.check_status;
exports.update_status = scheduler_component.update_status;