var spawn = require('cross-spawn');
var events = require('events');
var eventEmitter = new events.EventEmitter();
var vms = [];
var code = "";
var status = "not_started";
var update_timeout = 5000; // 5 seconds

log_output = function (output) {
    process.stdout.write(output);
    
    regexp = /Enter the code ([A-Z0-9]*) to authenticate/i;
    matches_array = regexp.exec(output);
    if (matches_array !== null && matches_array.length > 0) {
        code = matches_array[1];
    }
};

azure_disable_telemetry = function(callback) {
  disable_telemetry = spawn('azure', ['telemetry', '--disable']);
  
  disable_telemetry.stdout.on('data', log_output);
  disable_telemetry.stderr.on('data', log_output);

  disable_telemetry.on('close', (code) => callback());
};

azure_login = function(callback) {
  login = spawn('azure', ['login']);
  
  login.stdout.on('data', log_output);
  login.stderr.on('data', log_output);

  login.on('close', (code) => callback());
};

azure_set_account = function(callback) {
  code = "done!";
  set_account = spawn('azure',['account','set', process.env.subscriptionId]);

  set_account.stdout.on('data', log_output);
  set_account.stderr.on('data', log_output);

  set_account.on('close', () => callback());
};

azure_load_vms = function(callback) {
  console.log("Loading vms...");
  list_vms = spawn('azure',['vm','list', '--json']);
  
  vm_data = "";

  list_vms.stdout.on('data', (data) => { 
    vm_data += data;
  });
  list_vms.stderr.on('data', log_output);

  list_vms.on('close', (code3) => {
    try {
      vms = JSON.parse(vm_data);
      console.log("Loaded " + vms.length + " machines.");
    } catch(e) {
      console.log(e); // error in the string, we try again later
      console.log('Full VMdata: ' + vm_data);

      // Force a diagnostic
      temp = spawn('azure',['vm','list', '--json', '-vv']);
      temp.stdout.on('data', (output) => {console.log("" + output);});
    }

    setTimeout(() => azure_load_vms(callback), update_timeout);
    callback();
  });
};

azure_stop_vm = function(resourcegrp, virtualmachine, callback) {
  if (status !== 'done') {
    callback("Status is not good.");
  } else {
    deallocate_vm = spawn('azure',['vm','deallocate',resourcegrp, virtualmachine]);
    callback();

    deallocate_vm.stdout.on('data', log_output);
    deallocate_vm.stderr.on('data', log_output);
  }
};

azure_start_vm = function(resourcegrp, virtualmachine, callback) {
  if (status !== 'done') {
    callback("Status is not good.");
  } else {
    start_vm = spawn('azure',['vm','start',resourcegrp, virtualmachine]);
    callback();

    start_vm.stdout.on('data', log_output);
    start_vm.stderr.on('data', log_output);
  }
};

eventEmitter.on('started', () => {
  status = 'started';
  azure_disable_telemetry(() => eventEmitter.emit('login'));
});

eventEmitter.on('login', () => {
  status = 'login';
  azure_login(() => eventEmitter.emit('logged_on'));
});

eventEmitter.on('logged_on', () => {
  status = 'logged_on';
  azure_set_account(() => eventEmitter.emit('account_set'));
});

eventEmitter.on('account_set', () => {
  status = 'done';
  azure_load_vms(() => eventEmitter.emit('vms_loaded'));
});

start_events = function() {
    eventEmitter.emit('started');
};

get_vms = function() {
    return vms;
};

get_status = function() {
    return status;
};

get_code = function () {
    return code;
};

exports.start_events = start_events;
exports.get_vms = get_vms;
exports.get_code = get_code;
exports.get_status = get_status;
exports.stop_vm = azure_stop_vm;
exports.start_vm = azure_start_vm;
