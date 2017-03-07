/*jshint esversion: 6 */

// TOOD: USE PROMISE & ASYNC AWAIT

var resources_module = (function () {
    var my = {}; // public module
    var load = require('./load.js');
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
    
    my.get_info = function(callback) {
        active = getActiveMachineCount();
        up = getScalingUpCount();
        down = getScalingDownCount();
        callback(null, {
            at_start: my.at_start_amount, 
            on_demand: my.on_demand_amount, 
            learning: my.learning_amount,
            policy: my.policy,
            active: active, 
            up: up, 
            down: down
        })
    };

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

    var get_loads = function() {
        // Get active machine names array
        // [ "node-01", "node-02", "node-03", ... ]

        // Get load per machine
        // Save this is a new array

        // Return the loads.


        // PERHAPS, make this an interval-based update??
    }

    var check_resources_atstart = function() {
        console.log("Checking resources for atstart policy.");
    };

    var check_resources_ondemand = function() {
        console.log("Checking load of machines for ondemand policy.");

        req = client.get("http://"+scaling_host+":8888/virtualmachines", function (data, response) {
            data.forEach(function(vm) {
                if (vm.name.startsWith("node")) {
                    if (machines[vm.name] === undefined) {
                        machines[vm.name] = {};
                    }
                    
                    console.log("Getting load for: " + vm);
                    load.get_load(vm, (load_data) => {
                        console.log(load_data);
                        // TODO: Update with real value
                        machines[key].load = load_data.system.load;
                    });
                } 
            });

            var live_machines = Object.keys(machines).filter((key) => {
                // true if machine = available
                // false if machine = drain
                // TODO: rewrite this to ASYNC AWAIT!!
                //var machineIsAvailable = await getMachineAvailability(key, (err, data) => {});
                //return machineIsAvailable;
            });

            // If load for all available machines is higher than x
            var has_high_load = (key) => {machines[key].load > x};
            if (live_machines.every(has_high_load)) {
                // Set a new machine to available

                // 1. Get machine which is not set to available yet
                // 1b. If no machine extra available -- too bad
                // 2. Set machine to available
            } else {
                // If load is lower than y for a machine, and other machines are not all higher than x
                var has_low_load = (key) => {machines[key].load < y};
                var lower = live_machines.filter(has_low_load);
                if (lower.length > 1) {
                    // Set [0] to drain
                } else if (lower.length === 1) {
                    var higher = live_machines.filter(has_high_load);
                    if (higher.length !== live_machines.length - 1) {
                        // Set this machine to drain
                    }
                }
            }
        });
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

                        // Seems to happen now?
                        if (vm.powerState === "VM stopped") {
                            machines[vm.name] = {};
                            shutdownMachine(machines[vm.name].resourceGroup, vm.name, function(error) {
                                if (!error) {
                                    machines[vm.name].deactivated = true;
                                }
                            });
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

    var scaleUp = function(amount) {
        if (amount === 0) {
            my.scaling = false;
            return;
        }

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
            my.scaling = false;
            return;
        }

        console.log("Scaling up VM: " + key);
        startMachine(machines[key].resourceGroup, key, function(error) {
            if (!error) {
                setMachineAvailability(key, "active", function(error) {
                    if (!error) {
                        machines[key].activated = true;
                        scaleUp(amount - 1);
                    } else {
                        // RETRY?
                        scaleUp(amount);
                    }
                });
            }
        });
    };

    var scaleDown = function(amount) {
        if (amount === 0) {
            my.scaling = false;
            return;
        }

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
            my.scaling = false;
            return;
        }

        console.log("Scaling down VM: " + key);
        shutdownMachine(machines[key].resourceGroup, key, function(error) {
            if (!error) {
                setMachineAvailability(key, "drain", function(error) {
                    if (!error) {                
                        machines[key].deactivated = true;
                        scaleDown(amount - 1);
                    } else {
                        // RETRY?
                        scaleDown(amount);
                    }
                });
            }
        });
    };

    var setMachineAvailability = function(hostname, availability, callback) {
        req = client.post("http://"+docker_host+":4444/node/" + hostname + "/" + availability, function(data, response) {
            if (response.statusCode == 200) {
                console.log("Set machine " + hostname + " to " + availability);
                callback();
            } else {
                console.log("Error while setting machine " + hostname + " to " + availability);
                console.log(data);
                callback(data);
            }
        });
        req.on('error', (err) => {
            console.log("Error while setting machine " + hostname + " to " + availability);
            console.log(err);
            callback(err);
        });
    };

    var getMachineAvailability = function(hostname, callback) {
        req = client.get("http://"+docker_host+":4444/node/" + hostname, function(data, response) {
            if (response.statusCode == 200) {
                callback(null, data);
            } else {
                console.log("Error while getting machine " + hostname + " availability.");
                console.log(data);
                callback(data);
            }
        });
        req.on('error', (err) => {
            console.log("Error while getting machine " + hostname + " availability.");
            console.log(err);
            callback(err);
        });
    };

    // Can still fail??
    var startMachine = function(resourceGroup, hostname, callback) {
        req = client.post("http://"+scaling_host+":8888/virtualmachines/" + resourceGroup + "/" + hostname, function (data, response) {
            if (response.statusCode == 200) {
                callback();
            } else {
                console.log("Error while starting machine " + hostname);
                console.log(data);
                callback(data);
            }
        });
        req.on('error', (err) => {
            console.log("Error while starting machine " + hostname);
            console.log(err);
            callback(err);
        });
    };

    // Can still fail??
    var shutdownMachine = function(resourceGroup, hostname, callback) {
        req = client.delete("http://"+scaling_host+":8888/virtualmachines/" + resourceGroup + "/" + hostname, function (data, response) {
            if (response.statusCode == 200) {
                callback();
            } else {
                console.log("Error while shutting down machine " + hostname);
                console.log(data);
                callback(data);
            }
        });
        req.on('error', (err) => {
            console.log("Error while shutting down machine " + hostname);
            console.log(err);
            callback(err);
        });
    };

    var getStatus = function(callback) {
        req = client.get("http://"+scaling_host+":8888/status", function (data, response) {
            if (response.statusCode === 200) {
                callback("ok");
            } else {
                callback("Got statuscode: " + response.statusCode);
            }
        });
        req.on('error', (err) => callback(err));
    };

    my.scaling = false;
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
                        if (diff === 0) {
                            console.log("Nothing to scale.");
                            my.scaling = false;
                            callback(null, diff);
                        } else {

                            // Already scaling stuff!
                            if (my.scaling) {
                                console.log("Not scaling " + diff + " machines, already scaling.");    
                            } else {
                                my.scaling = true;
                                if (diff > 0) {
                                    var scalingUpCount = getScalingUpCount();
                                    var toActivate = amount - (activeCount + scalingUpCount);
                                    if (toActivate > 0) {
                                        console.log("Scaling up " + toActivate + " machines, to get to " + amount);
                                        scaleUp(toActivate);
                                    }
                                } else if (diff < 0) {
                                    // This works better than taking the scaling down machines into account
                                    var toDeactivate = Math.abs(diff);
                                    if (toDeactivate > 0) {
                                        console.log("Scaling down " + toDeactivate + " machines to reach " + amount);
                                        scaleDown(toDeactivate);
                                    }
                                }
                            }
                        }

                        // DONE, give back diff
                        callback(null, diff);
                    }
                });
            }
        });
    };


    return my;
})();

exports.check_resources = resources_module.check_resources;
exports.set_policy = resources_module.set_policy;
exports.get_policy = resources_module.get_policy;
exports.get_machine_count = resources_module.get_machine_count;
exports.get_amount = resources_module.get_amount;
exports.set_amount = resources_module.set_amount;
exports.get_info = resources_module.get_info;