/*jshint esversion: 6 */

scaling_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var scaling_host = process.env.SCALING_HOST || 'localhost';
    var component = {};
    component.status = {
        message: "not updated yet",
        statusCode: 500
    };

    component.update_status = function(interval) {
        var req = client.get("http://" + scaling_host + ":8888/status", (data, response) => {
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

exports.check_status = scaling_component.check_status;
exports.update_status = scaling_component.update_status;