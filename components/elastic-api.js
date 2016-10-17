/*jshint esversion: 6 */

var Client = require('node-rest-client').Client;
var client = new Client();

check_api_status = function(err, ready) {
    host = process.env.API_HOST;
    var req = client.get("http://" + host + ":3000/status", (data, response) => {
        // console.log("Got response for api: " + data);
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', (error) => {
        // console.log("Got error for api: " + error);
        err(error);
    });

    setTimeout(() => check_api_status(err, ready), 2000);
};

exports.check_api_status = check_api_status;