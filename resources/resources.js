/*jshint esversion: 6 */

var resources_module = (function () {
    var my = {}; // public module
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var host = process.env.SCALING || "localhost";
    var machines = {};

    my.policy = "Off"; // Start in OFF mode
    my.at_start_amount = 1;

    my.check_resources = function() {
        // First determine what policy is in effect
        if (my.policy === "Off") {
            set_machine_amount(0);
        } else if (my.policy === "AtStart") {
            set_machine_amount(my.at_start_amount);
        } else if (my.policy === "OnDemand") {
            check_resources_ondemand();
        } else if (my.policy === "Learning") {
            check_resources_learning();
        }
    };

    var check_resources_ondemand = function() {
        console.log("Checking resource for ondemand policy.");
    };

    var check_resources_learning = function() {
        console.log("Checking resource for learning policy.");
    };

    var updateMachines = function(callback) {
        req = client.get("http://"+host+":8888/virtualmachines", function (data, response) {
            data.forEach(function(vm) {
                if (vm.name.startsWith("node")) {
                    if (machines[vm.name] === undefined) {
                        machines[vm.name] = {};
                    }

                    // Check if state is changed (also triggers first run)
                    if (machines[vm.name].state !== vm.powerState) {
                        // Reset flags on end-state
                        if (vm.powerState === "VM running" || vm.powerState === "VM deallocated") {
                            machines[vm.name] = {};
                        }

                        // Update state
                        machines[vm.name].state = vm.powerState;
                        machines[vm.name].resourceGroup = vm.resourceGroupName;
                    }
                }
            });
            callback();
        });

        req.on('error', (err) => callback(err));
    };

    var getActiveMachineCount = function() {
        var count = 0;
        Object.keys(machines).forEach(function(key, index) {
            if (machines[key].state === "VM running") {
                count++;
            } 
        });
        return count;
    };

    var getScalingUpCount = function() {
        var count = 0;
        Object.keys(machines).forEach(function(key, index) {
            if (machines[key].activated !== undefined) {
                count++;
            } 
        });
        return count;
    };

    var getScalingDownCount = function() {
        var count = 0;
        Object.keys(machines).forEach(function(key, index) {
            if (machines[key].deactivated !== undefined) {
                count++;
            } 
        });
        return count;
    };

    var scaleOneUp = function() {
        // Select machine to scale
        var key = Object.keys(machines).find(function(key) {
            if (machines[key].state !== "VM running" && 
                !machines[key].activated && 
                !machines[key].deactivated){
                return true;
            } else {
                return false;
            }
        });
        // Failed
        if (key === undefined) {
            console.log("No machines to scale.");
            return;
        }
        console.log("Scaling up VM: " + key);

        // Register machines as scaled
        machines[key].activated = true;

        // Call scaling API with key
        req = client.post("http://"+host+":8888/virtualmachines/" + machines[key].resourceGroup + "/" + key, function (data, response) {
            console.log(data);
        });
        req.on('error', (err) => console.log(err));
    };

    var scaleOneDown = function() {
        // Select machine to scale
        var key = Object.keys(machines).find(function(key) {
            if (machines[key].state !== "VM deallocated" && 
                !machines[key].activated && 
                !machines[key].deactivated){
                return true;
            } else {
                return false;
            }
        });
        // Failed
        if (key === undefined) {
            console.log("No machines to scale.");
            return;
        }
        console.log("Scaling down VM: " + key);

        // Register machines as scaled
        machines[key].deactivated = true;

        // Call scaling API with key
        req = client.delete("http://"+host+":8888/virtualmachines/" + machines[key].resourceGroup + "/" + key, function (data, response) {
            console.log(data);
        });
        req.on('error', (err) => console.log(err));
    };

    var getStatus = function(callback) {
        // Call scaling API with key
        req = client.get("http://"+host+":8888/status", function (data, response) {
            if (response.statusCode === 200) {
                callback("ok");
            } else if (response.statusCode === 206) {
                callback("Waiting for login.");
            } else {
                callback("Got statuscode: " + response.statusCode);
            }
        });
        req.on('error', (err) => callback(err));
    };

    var set_machine_amount = function(amount) {
        getStatus(function(status) {
            if (status !== "ok") {
                console.log(status);
            } else {

                updateMachines(function(error) {
                    if (error) {
                        console.log(error);
                    } else {
                        var activeCount = getActiveMachineCount();
                        console.log("Current active machines: " + activeCount);
                        var diff = amount - activeCount;

                        if (diff > 0) {
                            var scalingUpCount = getScalingUpCount();
                            console.log("Current amount of machines scaling up: " + scalingUpCount);
                            var toActivate = amount - (activeCount + scalingUpCount);
                            if (toActivate > 0) {
                                console.log("Scaling up " + toActivate + " machines, to get to " + amount);
                                for (var i = 0; i < toActivate; i++) {
                                    scaleOneUp();
                                }
                            }
                        } else if (diff < 0) {
                            var scalingDownCount = getScalingDownCount();
                            console.log("Current amount of machines scaling down: " + scalingDownCount);
                            var toDeactivate = (activeCount - scalingDownCount) - amount;
                            if (toDeactivate > 0) {
                                console.log("Scaling down " + toDeactivate + " machines to reach " + amount);
                                for (var j = 0; j < toDeactivate; j++) {
                                    scaleOneDown();
                                }
                            }
                        }
                    }
                });

            }
        });
    };

    my.set_policy = function(policy) {
        // Add check for valid options?
        my.policy = policy;
        console.log("Policy set to: " + policy);
    };

    return my;
})();

exports.check_resources = resources_module.check_resources;
exports.set_policy = resources_module.set_policy;