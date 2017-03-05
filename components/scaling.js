/*jshint esversion: 6 */

scaling_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var scaling_host = process.env.SCALING_HOST || 'localhost';
    var component = {};
    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    var virtualmachines = [];

    component.start_updates = function(interval) {
        update_status(interval);
        update_virtualmachines(10*interval);
    }

    update_status = function(interval) {
        var req = client.get("http://" + scaling_host + ":8888/status", (data, response) => {
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

    update_virtualmachines = function(interval) {
        var req = client.get("http://" + scaling_host + ":8888/virtualmachines", (data, response) => {
            virtualmachines = data;
            setTimeout(() => update_virtualmachines(interval), interval);
        });

        req.on('error', (error) => {
            console.log(error);
            status.statusCode = 500;
            status.message = error.code;
            
            setTimeout(() => update_virtualmachines(interval), interval);
        });        
    }

    component.check_status = function() {
        return status;
    };

    component.get_virtualmachines = function() {
        return virtualmachines;
    }

    return component;
}());

exports.check_status = scaling_component.check_status;
exports.start_updates = scaling_component.start_updates;
exports.get_virtualmachines = scaling_component.get_virtualmachines;