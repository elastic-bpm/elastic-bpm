/*jshint esversion: 6 */

docker_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var docker_host = process.env.DOCKER_HOST || 'localhost';
    var component = {};
    component.status = {
        message: "not updated yet",
        statusCode: 500
    };

    component.update_status = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/status", (data, response) => {
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

exports.check_status = docker_component.check_status;
exports.update_status = docker_component.update_status;