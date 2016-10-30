/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

connected = false;

check_docker_status = function(err, ready) {
    host = process.env.DOCKER_HOST;
    var req = client.get("http://" + host + ":4444/status", (data, response) => {
        // console.log("Got response for docker: " + data);
        if (response.statusCode == 200) {
            connected = true;
            ready();
        } else {
            err(response.statusCode, data);
            connected = false;
        }
    });

    req.on('error', (error) => err(0, error));

    setTimeout(() => check_docker_status(err, ready), 2000);
};

get_containers = function(callback) {
    host = process.env.DOCKER_HOST;
    if (connected) {
        var req = client.get("http://" + host + ":4444/containers", (data, response) => {
            // console.log("Got response for docker: " + data);
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

exports.check_docker_status = check_docker_status;
exports.get_containers = get_containers;