var spawn = require('cross-spawn');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var vms = {};
var code = "";

log_output = function (output) {
    process.stdout.write(output);
    
    regexp = /Enter the code ([A-Z0-9]*) to authenticate/i;
    matches_array = regexp.exec(output);
    if (matches_array !== null && matches_array.length > 0) {
        code = matches_array[1];
    }
};

azure_disable_telemetry = function(callback) {
  login = spawn('azure', ['telemetry', '--disable']);
  
  login.stdout.on('data', log_output);
  login.stderr.on('data', log_output);

  login.on('close', (code) => callback());
};

azure_login = function(callback) {
  login = spawn('azure', ['login']);
  
  login.stdout.on('data', log_output);
  login.stderr.on('data', log_output);

  login.on('close', (code) => callback());
};

azure_set_account = function(callback) {
  code = "done!";
  set_account = spawn('azure',['account','set', '4 - docker swarm']);
  
  set_account.stdout.on('data', log_output);
  set_account.stderr.on('data', log_output);

  set_account.on('close', (code2) => callback());
};

azure_load_vms = function(callback) {
  list_vms = spawn('azure',['vm','list', '--json']);
  
  list_vms.stdout.on('data', (data) => { vms = JSON.parse(data); });
  list_vms.stderr.on('data', log_output);

  list_vms.on('close', (code3) => {
    setTimeout(() => azure_load_vms(callback), 10000);
    callback();
  });
};

eventEmitter.on('started', () => {
  azure_disable_telemetry(() => eventEmitter.emit('login'));
});

eventEmitter.on('login', () => {
  azure_login(() => eventEmitter.emit('logged_on'));
});

eventEmitter.on('logged_on', () => {
  azure_set_account(() => eventEmitter.emit('account_set'));
});

eventEmitter.on('account_set', () => {
  azure_load_vms(() => eventEmitter.emit('vms_loaded'));
});

start_events = function() {
    eventEmitter.emit('started');
};

get_vms = function() {
    return vms;
};

get_code = function () {
    return code;
};

exports.start_events = start_events;
exports.get_vms = get_vms;
exports.get_code = get_code;
