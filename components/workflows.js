/*jshint esversion: 6 */

workflow_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var component = {};
    component.status = {
        message: "ok",
        statusCode: 200
    };

    component.update_status = function(interval) {
        host = process.env.API_HOST || 'localhost';
        var req = client.get("http://" + host + ":3000/status", (data, response) => {
            component.status.statusCode = response.statusCode;
            component.status.statusMessage = response.statusMessage;

            setTimeout(() => component.update_status(interval), interval);
        });

        req.on('error', (error) => {
            component.status.message = error.errno;
            component.status.statusCode = 500;

            setTimeout(() => component.update_status(interval), interval);
        });
    }

    component.check_status = function() {
        return component.status;
    };

    return component;
}());

exports.check_status = workflow_component.check_status;
exports.update_status = workflow_component.update_status;