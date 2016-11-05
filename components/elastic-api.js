/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

a_check_api_status = function(err, ready) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/status", (data, response) => {
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', (error) => {
        err(error);
    });

    setTimeout(() => a_check_api_status(err, ready), 2000);
};

a_create_workflow = function(body, callback) {
    host = process.env.API_HOST;

    var args = {
        data: body,
        headers: { "Content-Type": "application/json" }
    };

    var req = client.post("http://" + host + ":3000/workflows", args, (data, response) => {
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        callback(""+error, null);
    });
};

a_create_multiple_workflows = function(workflows, callback) {
    host = process.env.API_HOST;

    var args = {
        data: workflows,
        headers: { "Content-Type": "application/json" }
    };

    var req = client.post("http://" + host + ":3000/workflows/multiple", args, (data, response) => {
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        callback(""+error, null);
    });
};

a_delete_workflow = function(workflow_id, callback) {
    host = process.env.API_HOST;
    var req = client.delete("http://" + host + ":3000/workflows/" + workflow_id, (data, response) => {
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        callback(""+error, null);
    });
};

a_delete_all_workflows = function(callback) {
    host = process.env.API_HOST;
    var req = client.delete("http://" + host + ":3000/workflows", (data, response) => {
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        callback(""+error, null);
    });
};

a_get_workflows = function(callback) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/workflows", (data, response) => {
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        callback(""+error, null);
    });
};

exports.check_api_status = a_check_api_status;
exports.get_workflows = a_get_workflows;
exports.create_workflow = a_create_workflow;
exports.delete_workflow = a_delete_workflow;
exports.delete_all_workflows = a_delete_all_workflows;
exports.create_multiple_workflows = a_create_multiple_workflows;