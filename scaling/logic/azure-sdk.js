/*jshint esversion: 6 */

var azure_sdk = (function () {
    var msRestAzure = require('ms-rest-azure');
    var ComputeClient = require('azure-arm-compute');
    var clientId = process.env.CLIENT_ID;
    var domain = process.env.DOMAIN;
    var secret = process.env.APPLICATION_SECRET;
    var subscriptionId = process.env.AZURE_SUBSCRIPTION_ID;
    var credentials = new msRestAzure.ApplicationTokenCredentials(clientId, domain, secret);
    var computeClient = new ComputeClient(credentials, subscriptionId);

    var my = {}; // public module
    my.vms = {};
    my.desired = {};
    my.status = "start";

    var updateVMs = function() {
        computeClient.virtualMachines.listAll(function (err, result, request, response) {
            if (err) {
                console.log(err);
            } else {
                new_vms = [];
                result.forEach(function(element) {
                  id_arr = element.id.split('/');
                  computeClient.virtualMachines.get(id_arr[4], element.name,  {expand: "instanceView"}, function (err, result, request, response) {
                      //console.log(element.name + " - " + result.instanceView.statuses[1].displayStatus);
                      if (err) {
                          console.log(err);
                      } else {
                        if (result.instanceView.statuses.length === 2) {
                            result.powerState = result.instanceView.statuses[1].displayStatus;
                        } else if (result.instanceView.statuses.length === 1) {
                            result.powerState = result.instanceView.statuses[0].displayStatus;
                        } else {
                            console.log(result.instanceView.statuses);
                            result.powerState = "unknown";
                        }

                        result.resourceGroupName = result.id.split('/')[4];
                        my.vms[result.name] = result;

                        if (result.powerState === 'VM running' && my.desired[result.name] === 'stop') {
                            stop_vm(result.resourceGroupName, result.name);
                        } else if (result.powerState === 'VM deallocated' && my.desired[result.name] === 'start') {
                            start_vm(result.resourceGroupName, result.name);
                        }
                      }
                  });
                });
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
        vm_array = [];

        Object.keys(my.vms).forEach(function(key, index) {
            vm_array.push(this[key]);
        }, my.vms);

        // Sort is 'in place', but also returns the sorted array
        return vm_array.sort(function(a, b) {
            if (a.name === b.name) return 0; // never going to happen
            return a.name < b.name ? -1 : 1;
        });
    };

    my.get_status = function() {
        return my.status;
    };

    var stop_vm = function(resourcegrp, virtualmachine) {
        console.log("Now stopping ", resourcegrp, virtualmachine);
        computeClient.virtualMachines.deallocate(resourcegrp, virtualmachine, function(error){
            if (error) {
                console.log(error);
            }
        });
    };

    var start_vm = function(resourcegrp, virtualmachine) {
        console.log("Now starting ", resourcegrp, virtualmachine);
        computeClient.virtualMachines.start(resourcegrp, virtualmachine, function(error){
            if (error) {
                console.log(error);
            }
        });
    };

    my.set_desired = function(resourcegrp, virtualmachine, state, callback) {
        // console.log("Set desired state for " + virtualmachine + " to " + state);
        my.desired[virtualmachine] = state;
        callback();
    }

    return my;
})();

exports.start_events = azure_sdk.start_events;
exports.get_vms = azure_sdk.get_vms;
exports.get_status = azure_sdk.get_status;
exports.set_desired = azure_sdk.set_desired;