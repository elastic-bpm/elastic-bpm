/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

connected = false;

check_docker_status = function(err, ready) {
    var req = client.get("http://" + process.env.DOCKER_HOST + ":4444/status", (data, response) => {
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

e_get_data = function(callback, url) {
    if (connected) {
        var req = client.get(url, (data, response) => {
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
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/containers/local");
};

e_get_containers_remote = function(callback) {
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/containers/remote");
};

e_get_docker_info_local = function(callback) {
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/info/local");
};

e_get_docker_info_remote = function(callback) {
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/info/remote");
};

e_get_services = function(callback) {
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/services");
};

e_get_workers = function(callback) {
    e_get_data(callback, "http://" + process.env.DOCKER_HOST + ":4444/workers");
};

exports.check_docker_status = check_docker_status;
exports.get_containers_local = e_get_containers_local;
exports.get_containers_remote = e_get_containers_remote;
exports.get_docker_info_local = e_get_docker_info_local;
exports.get_docker_info_remote = e_get_docker_info_remote;
exports.get_services = e_get_services;
exports.get_workers = e_get_workers;