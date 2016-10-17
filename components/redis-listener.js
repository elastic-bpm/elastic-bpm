/*jshint esversion: 6 */

var redis = require("redis");
var client = {};

connect_client = function(err, ready) {
    client = redis.createClient(6379, process.env.REDIS_HOST);
    
    client.on("error", () => {
        // console.log("Error connecting to REDIS");
        err();
    });

    client.on("ready", () => {
        // console.log("Connected to REDIS");
        ready();
    });

};

register_events = function(callback) {
    client.monitor(function (err, res) {
        // console.log("Entering monitoring mode.");
    });

    client.on("monitor", function (time, args, raw_reply) {
        timeMs = Number(time)*1000; // Convert the time to millisecons - maybe :-(
        timeObj = new Date(timeMs);
        event = {time:timeObj.toJSON(), title:args[0], message:args.join(", ")};
        callback(event);
    });
};

exports.register_events = register_events;
exports.connect_client = connect_client;