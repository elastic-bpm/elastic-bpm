/*jshint esversion: 6 */

redis_component = (function () {
    var redis = require("redis");
    var client = {};
    var component = {};
    component.status = {
        message: "not updated yet",
        statusCode: 500
    };

    component.update_status = function(interval) {
        component.client = redis.createClient(6379, process.env.REDIS_HOST);
        
        component.client.on("error", () => {
            component.status = {
                message: "error",
                statusCode: 500
            }
        });

        component.client.on("ready", () => {
            component.status = {
                message: "ok",
                statusCode: 200
            }
        });
    }

    component.check_status = function() {
        return component.status;
    };

    return component;
}());

exports.check_status = redis_component.check_status;
exports.update_status = redis_component.update_status;