var redis = require("redis"),
    client = redis.createClient(6379, process.env.REDIS_HOST);

register_events = function(callback) {
    client.monitor(function (err, res) {
        console.log("Entering monitoring mode.");
    });

    client.on("monitor", function (time, args, raw_reply) {
        timeMs = eval(time)*1000; // Convert the time to millisecons - maybe :-(
        timeObj = new Date(timeMs);
        event = {time:timeObj.toJSON(), title:args[0], message:args.join(", ")};
        callback(event);
    });
};

exports.register_events = register_events;