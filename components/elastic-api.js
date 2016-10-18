/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

check_api_status = function(err, ready) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/status", (data, response) => {
        // console.log("Got response for api: " + data);
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', (error) => {
        // console.log("Got error for api: " + error);
        err(error);
    });

    setTimeout(() => check_api_status(err, ready), 2000);
};

create_workflow = function(body, callback) {
    host = process.env.API_HOST;

    // set content-type header and data as json in args parameter 
    var args = {
        data: { name: body.name, owner: body.owner, description: body.description },
        headers: { "Content-Type": "application/json" }
    };

    var req = client.post("http://" + host + ":3000/workflows", args, (data, response) => {
        // console.log("Got response for api: " + data);
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        // console.log("Got error for api: " + error);
        callback(""+error, null);
    });
};

delete_workflow = function(workflow_id, callback) {
    host = process.env.API_HOST;
    var req = client.delete("http://" + host + ":3000/workflows/" + workflow_id, (data, response) => {
        // console.log("Got response for api: " + data);
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        // console.log("Got error for api: " + error);
        callback(""+error, null);
    });
};

get_workflows = function(callback) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/workflows", (data, response) => {
        // console.log("Got response for api: " + data);
        if (response.statusCode == 200) {
            callback(null, data);
        }
    });

    req.on('error', (error) => {
        // console.log("Got error for api: " + error);
        callback(""+error, null);
    });
};

exports.check_api_status = check_api_status;
exports.get_workflows = get_workflows;
exports.create_workflow = create_workflow;
exports.delete_workflow = delete_workflow;