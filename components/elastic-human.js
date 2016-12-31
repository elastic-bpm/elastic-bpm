/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

h_check_human_status = function(err, ready) {
    host = process.env.HUMAN_HOST;
    var req = client.get("http://" + host + ":5555/status", (data, response) => {
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', (error) => {
        err(error);
    });

    setTimeout(() => h_check_human_status(err, ready), 2000);
};

exports.check_human_status = h_check_human_status;