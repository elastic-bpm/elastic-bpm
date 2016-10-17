/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

check_status = function(err, ready) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/status", (data, response) => {
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', (error) => err(error));

    setTimeout(() => check_status(err, ready), 2000);
};

exports.check_status = check_status;