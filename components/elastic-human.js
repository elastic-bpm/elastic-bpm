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

h_start_humans = function(data, cb) {
    host = process.env.HUMAN_HOST;
    // set content-type header and data as json in args parameter 
    var args = {
        data: data,
        headers: { "Content-Type": "application/json" }
    };
    
    var req = client.post("http://" + host + ":5555/start", args, (data, response) => {
        if (response.statusCode == 200) {
            cb(null);
        }
    });

    req.on('error', (error) => {
        cb(error);
    });
};

h_get_human_info = function(cb) {
    host = process.env.HUMAN_HOST;
    var req = client.get("http://" + host + ":5555/info", (data, response) => {
        if (response.statusCode == 200) {
            cb(null, data);
        } else {
            cb(response, null);
        }
    });

    req.on('error', (error) => {
        cb(error, null);
    }); 
}

exports.check_human_status = h_check_human_status;
exports.start_humans = h_start_humans;
exports.get_human_info = h_get_human_info;