/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

connected = false;

get_vms = function(callback) {
    host = process.env.SCALING_HOST;
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

check_scaling_status = function(err, ready) {
    host = process.env.SCALING_HOST;
    var req = client.get("http://" + host + ":8888/status", (data, response) => {
        // console.log("Got response for scaling: " + data);
        if (response.statusCode == 200) {
            connected = true;
            ready();
        } else {
            err(response.statusCode, data);
            connected = false;
        }
    });

    req.on('error', (error) => err(0, error));

    setTimeout(() => check_scaling_status(err, ready), 2000);
};

exports.check_scaling_status = check_scaling_status;
exports.get_vms = get_vms;