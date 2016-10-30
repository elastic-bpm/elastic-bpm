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

e_get_containers = function(callback, argument) {
    host = process.env.DOCKER_HOST;
    if (connected) {
        var req = client.get("http://" + host + ":4444/containers/" + argument, (data, response) => {
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

e_get_containers_local = function(callback) {
    e_get_containers(callback, "local");
};

e_get_containers_remote = function(callback) {
    e_get_containers(callback, "remote");
};

e_get_docker_info = function(callback, argument) {
    host = process.env.DOCKER_HOST;
    if (connected) {
        var req = client.get("http://" + host + ":4444/info/" + argument, (data, response) => {
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

e_get_docker_info_local = function(callback) {
    e_get_docker_info(callback, "local");
};

e_get_docker_info_remote = function(callback) {
    e_get_docker_info(callback, "remote");
};

e_get_services = function(callback) {
    host = process.env.DOCKER_HOST;
    if (connected) {
        var req = client.get("http://" + host + ":4444/services", (data, response) => {
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
exports.get_containers_local = e_get_containers_local;
exports.get_containers_remote = e_get_containers_remote;
exports.get_docker_info_local = e_get_docker_info_local;
exports.get_docker_info_remote = e_get_docker_info_remote;
exports.get_services = e_get_services;