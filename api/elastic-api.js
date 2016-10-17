var Client = require('node-rest-client').Client;
var client = new Client();

check_status = function(err, ready) {
    var req = client.get("http://localhost:3000/workflows", (data, response) => {
        if (response.statusCode == 200) {
            ready();
        }
    });

    req.on('error', () => err());

    setTimeout(() => check_status(err, ready), 2000);
};

exports.check_status = check_status;