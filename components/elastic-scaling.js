/*jshint esversion: 6 */

elastic_scaling_component = (function () {
    var es = {};

    var Client = require('node-rest-client').Client;
    var client = new Client();

    var connected = false;
    var host = process.env.SCALING_HOST;

    es.get_vms = function(callback) {    
        if (connected) {
            var req = client.get("http://" + host + ":8888/virtualmachines", (data, response) => {
                // console.log("Got response for vms: " + data);
                if (response.statusCode == 200) {
                    callback(null, data);
                } else {
                    connected = false;
                    callback("not connected", null);
                }
            });

            req.on('error', (error) =>{
                connected = false;
                callback(""+error, null);
            });
        } else {
            callback("Not connected, check status", null);
        }
    };

    es.check_scaling_status = function(err, ready) {
        var req = client.get("http://" + host + ":8888/status", (data, response) => {
            if (response.statusCode == 200) {
                connected = true;
                ready();
            } else {
                err(response.statusCode, data);
                connected = false;
            }
        });

        req.on('error', (error) => {
            err(0, error);
        });

        setTimeout(() => es.check_scaling_status(err, ready), 2000);
    };

    es.stop_vm = function(resourcegroup, virtualmachine, callback) {
        var req = client.delete("http://" + host + ":8888/virtualmachines/"+resourcegroup+"/"+virtualmachine, (data, response) => {
            if (response.statusCode == 200) {
                callback(null, data);
            } else {
                callback("error: " + data, null);
            }
        });

        req.on('error', (error) => callback(error, null));
    };

    es.start_vm = function(resourcegroup, virtualmachine, callback) {
        var req = client.post("http://" + host + ":8888/virtualmachines/"+resourcegroup+"/"+virtualmachine, (data, response) => {
            if (response.statusCode == 200) {
                callback(null, data);
            } else {
                callback("error: " + data, null);
            }
        });

        req.on('error', (error) => callback(error, null));
    };

    return es;
}());

exports.check_scaling_status = elastic_scaling_component.check_scaling_status;
exports.get_vms = elastic_scaling_component.get_vms;
exports.start_vm = elastic_scaling_component.start_vm;
exports.stop_vm = elastic_scaling_component.stop_vm;