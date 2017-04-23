/*jshint esversion: 6 */

var workflows = require('./listener/workflows');
var bodyParser = require('body-parser');
var express = require('express'),
    app = express();
app.use(bodyParser.json());
var Client = require('node-rest-client').Client;
var client = new Client();

const os = require('os');
var log4js = require('log4js');

var elastic_host = process.env.ELASTIC_HOST || "localhost";
var elastic_port = process.env.ELASTIC_PORT || 12201;
log4js.configure({
    appenders: [
        { type: 'console' },
        {
            "host": elastic_host,
            "port": elastic_port,
            "type": "gelf",
            "hostname": "elastic-human@" + os.hostname(),
            "layout": {
                "type": "pattern",
                "pattern": "%m"
            },
            category: [ 'console' ]
        }
    ],
    replaceConsole: true
});

var active = false;
var paused = true;
var humans = null;
var stopTimer = null;
var initTimer = null;
var pauseTimer = null;
var unpauseTimer = null;
var onTime = null;
var offTime = null;
var initTime = null;
var totalTime = null;
var startTime = null;
var switchTime = null;
var i = 0;

function Human(name) {
    this.name = name;
    this.timer = null;
}

var send_result = function(human, task) {
    workflows.flag_task_done(task, (error, task) => {
        if (error && error !== "ignore") {
            console.log("Human " + human.name + " error: " + error + " when flagging task done.");
            setTimeout(() => {send_result(human, task);}, 1000); // retry after 1 sec
        } else {
            human.timer = setTimeout(function() {act_human(human);}, 1000);
        }
    });
};

act_human = function(human) {
    if (!active) {
        return;
    }

    if (paused) {
        console.log("Human " + human.name + " not acting, paused.");
        human.timer = setTimeout(function() {act_human(human);}, 1000);
    }  else {
        console.log("Human " + human.name + " acting");
        // Grab new task

        workflows.get_next_task((err, task) => {
            if (err) {
                console.log("Human " + human.name + " Error: " + err);
                human.timer = setTimeout(function() {act_human(human);}, 1000);
            } else {           
                if (task) {
                    console.log("Human " + human.name + " executing task " + task.task_id + " for workflow " + task.workflow_id);

                    // Executing task
                    task_length = parseInt(task.task_id.split(":")[2]) * 1000;
                    setTimeout(() => {
                        console.log("Human " + human.name + " done executing task " + task.task_id + " for workflow " + task.workflow_id);
                        send_result(human, task);
                    }, task_length);

                } else {
                    // Else, timeout to default
                    console.log("Human " + human.name + " No task.");
                    human.timer = setTimeout(function() {act_human(human);}, 1000);
                }
            }
        });
    }
};

start_humans = function(amount, on, off, init, total) {
    startTime = Date.now();
    onTime = on*1000*60;
    offTime = off*1000*60;
    initTime = init*1000*60;
    totalTime = total*1000*60;

    console.log("Amount: " + amount + ", On: " + on + ", Off: " + off + ", Init: " + init + ", Total: " + total);
    active = true;
    
    // Create humans
    humans = [];
    for (var i = 0; i < amount; i++) {
        humans.push(new Human("hal-" + i));
    }
    
    // Start up humans
    humans.map(function(h){act_human(h);});
    
    // Activate the fun after init time!
    console.log("Setting initTimer to: " + initTime);
    initTimer = setTimeout(function() {
        unpause_humans(onTime, offTime);
    }, initTime);

    // Stop when done
    stopTimer = setTimeout(stop_humans, totalTime);
};

unpause_humans = function(onTime, offTime) {
    if (active) {
        console.log("Resuming humans.");
        switchTime = Date.now();
        paused = false;
        pauseTimer = setTimeout(function() {
            pause_humans(onTime, offTime);
        }, onTime);
    }
};

pause_humans = function(onTime, offTime) {
    if (active) {
        console.log("Pausing humans.");
        switchTime = Date.now();
        paused = true;

        unpauseTimer = setTimeout(function() {
            unpause_humans(onTime, offTime);
        }, offTime);
    }
};


stop_humans = function() {
    console.log("Stopping humans");
    clearTimeout(stopTimer);
    clearTimeout(initTimer);
    clearTimeout(pauseTimer);
    clearTimeout(unpauseTimer);
    humans.map(function(h) {clearTimeout(h.timer);});
    active = false;
    paused = true;
};

post_start = function(req, res) {
    // Body is parsed to 'req.body'
    //console.log(req.body);

    // If active, first stop the humans
    if (active) {
        stop_humans();
    }

    // Start the humans!
    start_humans(req.body.amount, req.body.on, req.body.off, req.body.init, req.body.total);

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify('ok', null, 3));
};

post_stop = function (req, res) {
    if (active) {
        stop_humans();
    }

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify('ok', null, 3));
};

// ROUTING
setup_routes = function() {
    app.get('/status', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify('ok', null, 3));
    });

    app.get('/active', function(req, res) {
        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify(active, null, 3));
    });

    app.post('/start', post_start);
    app.post('/stop', post_stop);

    app.get('/info', function(req, res) {
        amount = 0;
        if (humans) {
            amount = humans.length;
        }

        res.setHeader('Content-Type', 'application/json');
        res.send(JSON.stringify({
            onTime: onTime,
            offTime: offTime,
            initTime: initTime,
            totalTime: totalTime,
            startTime: startTime,
            switchTime: switchTime,
            active: active,
            paused: paused,
            humans: amount
        }, null, 3));
    });
};

// Server startup
start_server = function() {
    app.listen(5555, function () {
        console.log('Elastic-human listening on port 5555!');
    });
};

// When run directly, serve the API
if (require.main === module) {
    setup_routes();
    start_server();
}