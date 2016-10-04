var express = require('express');
var app = express();

var workflows = [
    {
        name: "wf1", 
        owner: "johannes",
        created: (new Date()).toJSON(),
        description: "A -> B -> C"
    },
    {
        name: "wf2", 
        owner: "johannes",
        created: (new Date()).toJSON(),
        description: "A -> B -> C"
    },
];


app.get('/workflows', function (req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(workflows, null, 3));
});

app.post('/', function (req, res) {
  res.send('Got a POST request');
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});