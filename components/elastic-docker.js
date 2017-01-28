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

e_get_data = function(url, callback) {
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
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/containers/local", callback);
};

e_get_containers_remote = function(callback) {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/containers/remote", callback);
};

e_get_docker_info_local = function(callback) {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/info/local", callback);
};

e_docker_info_remote = [];
e_refresh_docker_info_remote = function() {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/info/remote", (error, data) => {
        if (error) {
            console.log("Error getting docker info remote: " + error);
        } else {
            e_docker_info_remote = data;
        }
    });
};

e_get_docker_info_remote = function(callback) {
    callback(null, e_docker_info_remote);
};

e_docker_nodes = [];
e_refresh_nodes = function() {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/nodes", (error, data) => {
        if (error) {
            console.log("Error getting information on nodes: " + error);
        } else {
            e_docker_nodes = data;          
        }
    });
};

e_get_nodes = function(callback) {
    callback(null, e_docker_nodes);
};

services = [];
e_refresh_services = function() {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/services", (error, data) => {
        if (error) {
            console.log("Error getting services: " + error);
        } else {
            services = data;
        }
    });
};

e_get_services = function(callback) {
    callback(null, services);
};

workers = [];
e_refresh_workers = function() {
    e_get_data("http://" + process.env.DOCKER_HOST + ":4444/workers", (error, data) => {
        if (error) {
            console.log("Error getting workers: " + error);
        } else {
            workers = data;
        }
    });
};

e_get_workers = function(callback) {
    callback(null, workers);
};

e_update_workers = function(put_data, callback) {
    if (connected) {
        args = {
            data: put_data,
            headers: { "Content-Type": "application/json" }
        };
        url = "http://" + process.env.DOCKER_HOST + ":4444/services/workers";
        var req = client.put(url, args, (data, response) => {
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

e_delete_workers = function(callback) {
    if (connected) {
        url = "http://" + process.env.DOCKER_HOST + ":4444/services/workers";
        var req = client.delete(url, (data, response) => {
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

e_create_workers = function(callback) {
    if (connected) {
        url = "http://" + process.env.DOCKER_HOST + ":4444/services/workers";
        var req = client.post(url, (data, response) => {
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

e_setup_updates = function() {
    timeout = 1000; // 1 sec

    e_refresh_workers();
    setInterval(e_refresh_workers, 10*timeout);

    e_refresh_services();
    setInterval(e_refresh_services, 10*timeout);

    e_refresh_nodes();
    setInterval(e_refresh_nodes, 10*timeout);

    e_refresh_docker_info_remote();
    setInterval(e_refresh_docker_info_remote, 60*timeout);
};

exports.check_docker_status = check_docker_status;
exports.get_containers_local = e_get_containers_local;
exports.get_containers_remote = e_get_containers_remote;
exports.get_docker_info_local = e_get_docker_info_local;
exports.get_docker_info_remote = e_get_docker_info_remote;
exports.get_services = e_get_services;
exports.get_nodes = e_get_nodes;
exports.get_workers = e_get_workers;
exports.delete_workers = e_delete_workers;
exports.create_workers = e_create_workers;
exports.update_workers = e_update_workers;
exports.setup_updates = e_setup_updates;