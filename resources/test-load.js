var load = require('./load.js');
var process = require('process');

if (process.argv.length < 3) {
    console.log("Usage: node test-load.js <hostname>");
} else {
    load.get_load(process.argv[2], (err, result) => {
        if (!err) {
            console.log(JSON.stringify(result, null, 2));
        }
    });
}