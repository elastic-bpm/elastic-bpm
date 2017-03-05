/*jshint esversion: 6 */

docker_component = (function () {
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var docker_host = process.env.DOCKER_HOST || 'localhost';
    var status = {message: "not updated yet", statusCode: 500};
    var info = {};
    var component = {};
    var containers = [];
    var services = [];
    var nodes = [];
    var workers = ["abc"];

    component.start_updates = function(interval) {
        update_status(interval);
        update_info(interval);
        update_containers(interval);
        update_services(interval);
        update_nodes(interval);
        update_workers(interval);
    }

    var update_status = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/status", (data, response) => {
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

    var update_info = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/info/remote", (data, response) => {
            info = data;
            setTimeout(() => update_info(interval), interval);
        });

        req.on('error', (error) => {
            setTimeout(() => update_info(interval), interval);
        });
    }

    var update_containers = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/containers/remote", (data, response) => {
            containers = data;
            setTimeout(() => update_containers(interval), interval);
        });

        req.on('error', (error) => {
            setTimeout(() => update_containers(interval), interval);
        });
    }

    var update_services = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/services", (data, response) => {
            services = data;
            setTimeout(() => update_services(interval), interval);
        });

        req.on('error', (error) => {
            setTimeout(() => update_services(interval), interval);
        });
    }

    var update_nodes = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/nodes", (data, response) => {
            nodes = data;
            setTimeout(() => update_nodes(interval), interval);
        });

        req.on('error', (error) => {
            setTimeout(() => update_nodes(interval), interval);
        });        
    }

    var update_workers = function(interval) {
        var req = client.get("http://" + docker_host + ":4444/workers", (data, response) => {
            workers = data;
            setTimeout(() => update_workers(interval), interval);
        });

        req.on('error', (error) => {
            setTimeout(() => update_workers(interval), interval);
        });        
    }

    component.check_status = function() {
        return status;
    };

    component.get_remote_info = function() {
        return info;
    }

    component.get_remote_containers = function() {
        return containers;
    }

    component.get_remote_services = function() {
        return services;
    }

    component.get_nodes = function() {
        return nodes;
    }

    component.get_workers = function() {
        return workers;
    }

    return component;
}());

exports.start_updates = docker_component.start_updates;
exports.check_status = docker_component.check_status;
exports.get_remote_info = docker_component.get_remote_info;
exports.get_remote_containers = docker_component.get_remote_containers;
exports.get_remote_services = docker_component.get_remote_services;
exports.get_nodes = docker_component.get_nodes;
exports.get_workers = docker_component.get_workers;