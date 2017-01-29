/*jshint esversion: 6 */

var resources_module = (function () {
    var my = {}; // public module
    var Client = require('node-rest-client').Client;
    var client = new Client();
    var scaling_host = process.env.SCALING || "localhost";
    var docker_host = process.env.DOCKER || "localhost";
    var machines = {};
    const workers_per_machine = 4;

    my.policy = "Off"; // Start in OFF mode
    my.at_start_amount = 1;
    my.on_demand_amount = 2;
    my.learning_amount = 3;
    
    my.set_amount = function(policy, amount, callback) {
        if (policy === "atstart") {
            my.at_start_amount = amount;
            console.log("At start amount set to: " + my.at_start_amount);
        } else if (policy === "ondemand") {
            my.on_demand_amount = amount;
            console.log("On demand amount set to: " + my.on_demand_amount);
        } else if (policy === "learning") {
            my.learning_amount = amount;
            console.log("Learning amount set to: " + my.learning_amount);
        } else {
            console.log("Policy: " + policy + " not known.");
            callback("Policy: " + policy + " not known.", null);
        }

        callback(null, my.amount);
        my.check_resources();
    };

    my.get_amount = function(callback) {
        callback(null, {at_start: my.at_start_amount, on_demand: my.on_demand_amount, learning: my.learning_amount});
    };

    my.check_resources = function() {
        // First determine what policy is in effect
        if (my.policy === "Off") {
            set_machine_amount(0, () => {});
        } else if (my.policy === "AtStart") {
            set_machine_amount(my.at_start_amount, (error, diff) => {
                if (!error && diff === 0) {
                    check_resources_atstart();
                }
            });
        } else if (my.policy === "OnDemand") {
            set_machine_amount(my.on_demand_amount, (error, diff) => {
                if (!error && diff === 0) {
                    check_resources_ondemand();
                }
            });
        } else if (my.policy === "Learning") {
            set_machine_amount(my.learning_amount, (error, diff) => {
                if (!error && diff === 0) {
                    check_resources_learning();
                }
            });
        }
    };

    var check_resources_atstart = function() {
        console.log("Checking resource for atstart policy.");
    };

    var check_resources_ondemand = function() {
        console.log("Checking resource for ondemand policy.");
    };

    var check_resources_learning = function() {
        console.log("Checking resource for learning policy.");
    };

    var updateMachines = function(callback) {
        req = client.get("http://"+scaling_host+":8888/virtualmachines", function (data, response) {
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
        req = client.post("http://"+scaling_host+":8888/virtualmachines/" + machines[key].resourceGroup + "/" + key, function (data, response) {
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


        // THIS NEEDS RX or functions?!

        // Set machine status to drain
        req = client.post("http://"+docker_host+":4444/node/" + key + "/drain", function(data, response) {
            if (response.statusCode == 200) {

                // Get amount of workers
                req_workers = client.get("http://"+docker_host+":4444/workers", function(data, response) {
                    if (response.statusCode == 200) {

                        if (data.length > 0) {
                            var target_amount = Math.max(data.length - workers_per_machine, 0);

                            // Scale workers down a notch
                            console.log("Scaling workers down to " + target_amount);
                            var args = {data: { scale: target_amount }};
                            scale_workers = client.put("http://"+docker_host+":4444/services/workers", args, function(data, response) {
                                if (response.statusCode == 200) {
                                    console.log("Scaled workers down to " + target_amount);

                                    // Scale machine down
                                    req2 = client.delete("http://"+scaling_host+":8888/virtualmachines/" + machines[key].resourceGroup + "/" + key, function (data, response) {
                                        console.log(data);
                                        
                                        // Register machines as scaled
                                        machines[key].deactivated = true;

                                    });
                                    req2.on('error', (err) => console.log(err));

                                } else {
                                    console.log("Error: " + data);
                                }
                            });

                        } else {

                            // No scaling of workers needed at 0
                            console.log("0 workers, so nothing to scale.");

                        }

                    } else {

                        console.log("Error while getting worker amount!");
                        console.log(data);

                    }

                });
                req_workers.on('error', (err) => console.log(err));

            } else {

                console.log("Error while setting node to drain!");
                console.log(data);

            }
        });
        req.on('error', (err) => console.log(err));

    };

    var getStatus = function(callback) {
        req = client.get("http://"+scaling_host+":8888/status", function (data, response) {
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

    var set_machine_amount = function(amount, callback) {
        getStatus(function(status) {
            if (status !== "ok") {
                console.log(status);
                callback(status, null);
            } else {

                updateMachines(function(error) {
                    if (error) {
                        console.log(error);
                        callback(error, null);
                    } else {
                        var activeCount = getActiveMachineCount();
                        var diff = amount - activeCount;

                        if (diff > 0) {
                            var scalingUpCount = getScalingUpCount();
                            var toActivate = amount - (activeCount + scalingUpCount);
                            if (toActivate > 0) {
                                console.log("Scaling up " + toActivate + " machines, to get to " + amount);
                                for (var i = 0; i < toActivate; i++) {
                                    scaleOneUp();
                                }
                            }
                        } else if (diff < 0) {
                            var scalingDownCount = getScalingDownCount();
                            var toDeactivate = (activeCount - scalingDownCount) - amount;
                            if (toDeactivate > 0) {
                                console.log("Scaling down " + toDeactivate + " machines to reach " + amount);
                                for (var j = 0; j < toDeactivate; j++) {
                                    scaleOneDown();
                                }
                            }
                        }

                        callback(null, diff);
                    }
                });

            }
        });
    };

    my.set_policy = function(policy, callback) {
        // Add check for valid options?
        my.policy = policy;
        console.log("Policy set to: " + policy);
        callback(null, my.policy);

        my.check_resources();
    };

    my.get_policy = function(callback) {
        callback(null, my.policy);
    };

    my.get_machine_count = function(callback) {
        active = getActiveMachineCount();
        up = getScalingUpCount();
        down = getScalingDownCount();
        callback(null, {active: active, up: up, down: down});
    };

    return my;
})();

exports.check_resources = resources_module.check_resources;
exports.set_policy = resources_module.set_policy;
exports.get_policy = resources_module.get_policy;
exports.get_machine_count = resources_module.get_machine_count;
exports.get_amount = resources_module.get_amount;
exports.set_amount = resources_module.set_amount;