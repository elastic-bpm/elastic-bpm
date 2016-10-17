/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

check_scaling_status = function(err, ready) {
    host = process.env.SCALING_HOST;
    var req = client.get("http://" + host + ":8888/status", (data, response) => {
        // console.log("Got response for scaling: " + data);
        if (response.statusCode == 200) {
            ready();
        } else {
            err(response.statusCode, data);
        }
    });

    req.on('error', (error) => err(0, error));

    setTimeout(() => check_scaling_status(err, ready), 2000);
};

exports.check_scaling_status = check_scaling_status;