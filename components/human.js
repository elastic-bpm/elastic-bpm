/*jshint esversion: 6 */

human_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var component = {};
    var human_host = process.env.HUMAN_HOST || 'localhost';
    component.status = {
        message: "not updated yet",
        statusCode: 500
    };

    component.update_status = function(interval) {
        var req = client.get("http://" + human_host + ":5555/status", (data, response) => {
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

exports.check_status = human_component.check_status;
exports.update_status = human_component.update_status;