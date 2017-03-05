/*jshint esversion: 6 */

workflow_component = (function () {
    var Client = require('node-rest-client').Client;
    var multiparty = require('multiparty');
    const fs = require('fs');
    var client = new Client();
    var component = {};
    var workflow_host = process.env.API_HOST || 'localhost';
    var status = {
        message: "not updated yet",
        statusCode: 500
    };
    component.workflows = [];

    component.start_updates = function(interval) {
        update_status(interval);
        update_workflows(interval);
    }

    var update_status = function(interval) {
        var req = client.get("http://" + workflow_host + ":3000/status", (data, response) => {
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

    var update_workflows = function(interval) {
        var req = client.get("http://" + workflow_host + ":3000/workflows", (data, response) => {
            component.workflows = data;
            setTimeout(() => update_workflows(interval), interval);
        });

        req.on('error', (error) => {
            status.statusCode = 500;
            status.message = error.code;
            
            setTimeout(() => update_workflows(interval), interval);
        });
    }

    component.create_workflow = function(body, cb) {
        var args = {
            data: body,
            headers: { "Content-Type": "application/json" }
        };
        var req = client.post("http://" + workflow_host + ":3000/workflows", args, (data, response) => {
            cb(null, data);
        });

        req.on('error', (error) => {
            cb(error, null);
        });
    };

    component.delete_workflow = function(workflowId, cb) {
        var req = client.delete("http://" + workflow_host + ":3000/workflows/" + workflowId, (data, response) => {
            cb(null, data);
        });

        req.on('error', (error) => {
            cb(error, null);
        });
    }

    component.delete_all_workflows = function(body, cb) {
        var req = client.delete("http://" + workflow_host + ":3000/workflows", (data, response) => {
            cb(null, data);
        });

        req.on('error', (error) => {
            cb(error, null);
        });
    }

    var get_workflows_from_file = function(req, cb) {
        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            if (err) {
                cb(err, null);
            } else if (files === undefined || files.workflow === undefined) {
                cb("Error creating workflow, file not found.", null);
            } else {
                let workflowsFromFile = {};
                try {
                    workflowsFromFile = JSON.parse(fs.readFileSync(files.workflow[0].path, 'utf8'));
                    fs.unlink(files.workflow[0].path, (unlink_err) => {
                        if (unlink_err){
                            cb(unlink_err, null);
                        } else {
                            cb(null, workflowsFromFile);
                        }
                    });
                } catch (e) {
                    cb(e, null);                
                }
            }
        });
    };

    component.create_workflows_from_file = function(req, cb) {
        get_workflows_from_file(req, (error, workflows) => {
            if (error) {
                cb(error, null);
            } else {
                if (workflows.length === 0) {
                    cb("No workflows to create!", null);
                }

                var args = {
                    data: workflows,
                    headers: { "Content-Type": "application/json" }
                };
                var req = client.post("http://" + workflow_host + ":3000/workflows/multiple", args, (data, response) => {
                    if (response.statusCode === 200) {
                        cb(null, data);
                    }
                });

                req.on('error', (error) => {
                    cb(""+error, null);
                });
            }
        })
    }

    component.check_status = function() {
        return status;
    };

    component.get_workflows = function() {
        return component.workflows;
    };

    return component;
}());

exports.check_status = workflow_component.check_status;
exports.start_updates = workflow_component.start_updates;
exports.get_workflows = workflow_component.get_workflows;
exports.create_workflow = workflow_component.create_workflow;
exports.delete_workflow = workflow_component.delete_workflow;
exports.create_workflows_from_file = workflow_component.create_workflows_from_file;
exports.delete_all_workflows = workflow_component.delete_all_workflows;