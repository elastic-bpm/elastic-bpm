/*jshint esversion: 6 */

var azure_sdk = (function () {
    var msRestAzure = require('ms-rest-azure');
    var ResourceManagementClient = require('azure-arm-resource').ResourceManagementClient;
    var ComputeClient = require('azure-arm-compute');
    var DevTestLabsClient = require('azure-arm-devtestlabs');
    var clientId = process.env.CLIENT_ID;
    var domain = process.env.DOMAIN;
    var secret = process.env.APPLICATION_SECRET;
    var subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    var resourceGroupName = process.env.resourceGroupName;
    var credentials = new msRestAzure.ApplicationTokenCredentials(clientId, domain, secret);
    var resourceClient = new ResourceManagementClient(credentials, subscriptionId);
    var computeClient = new ComputeClient(credentials, subscriptionId);
    var devTestLabsClient = new DevTestLabsClient(credentials, subscriptionId);

    var my = {}; // public module
    my.vms = [];
    my.status = "start";

    var updateVMs = function() {
        //computeClient.virtualMachines.get("DockerSwarm-master-01-381608", "master-01",  {expand: "instanceView"}, function (err, result, request, response) {
        computeClient.virtualMachines.listAll(function (err, result, request, response) {
        //devTestLabsClient.virtualMachine.list(resourceGroupName, "DockerSwarm",  function (err, result, request, response) {
        //resourceClient.resourceGroups.listResources(resourceGroupName, {expand: "instanceView"}, function (err, result, request, response) {
            if (err) {
                console.log(err);
            } else {
                new_vms = [];
                result.forEach(function(element) {
                  id_arr = element.id.split('/');
                  //console.log("Resource Group: " + id_arr[4]);
                  //console.log("VM name: " + element.name);
                  computeClient.virtualMachines.get(id_arr[4], element.name,  {expand: "instanceView"}, function (err, result, request, response) {
                      console.log(element.name + " - " + result.instanceView.statuses[1].displayStatus);
                  });
                });

                //console.log(result);
                //console.log(result.instanceView.statuses);
                my.vms = result;
            }
        });
    };

    my.start_events = function() {
        // Should be set to done after login
        my.status = 'done';

        // Also, loop the update of VMs
        updateVMs();
        setInterval(updateVMs, 10000);
    };

    my.get_vms = function() {
        return my.vms;
    };

    // NEVER USED
    my.get_code = function() {
        return "123";
    };

    my.get_status = function() {
        return my.status;
    };

    my.stop_vm = function(resourcegrp, virtualmachine, callback) {
        callback();
    };

    my.start_vm = function(resourcegrp, virtualmachine, callback) {
        callback();
    };

    return my;
})();

exports.start_events = azure_sdk.start_events;
exports.get_vms = azure_sdk.get_vms;
exports.get_code = azure_sdk.get_code;
exports.get_status = azure_sdk.get_status;
exports.stop_vm = azure_sdk.stop_vm;
exports.start_vm = azure_sdk.start_vm;