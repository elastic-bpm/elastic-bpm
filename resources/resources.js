var resources_module = (function () {
    var my = {}; // public module
    my.policy = "Off"; // Start in OFF mode
    my.at_start_amount = 10;

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

    var set_machine_amount = function(amount) {
        console.log("Scaling to " + amount);
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