const subscriptionId = process.env.subscriptionId;
const resourceGroupName = process.env.resourceGroupName;
const labName = process.env.labName;

var spawn = require('cross-spawn');

const login = spawn('azure', ['login']);
login.stdout.on('data', (data) => { process.stdout.write(data);});
login.stderr.on('data', (data) => { process.stdout.write(data);});

login.on('close', (code) => {
  const set_account = spawn('azure',['account','set', '4']);
  set_account.stdout.on('data', (data2) => { process.stdout.write(data2);});
  set_account.stderr.on('data', (data2) => { process.stdout.write(data2);});

  set_account.on('close', (code2) => {
    const list_vms = spawn('azure',['vm','list', '--json']);
    list_vms.stdout.on('data', (data3) => { 
      // process.stdout.write(data3);
      vms = JSON.parse(data3);
      // console.dir(vms);
      vms.forEach(function(element) {
        console.log("Name: " + element.name + ", powerState: " + element.powerState);
      }, this);
    });
    list_vms.stderr.on('data', (data3) => { process.stdout.write(data3);});

    list_vms.on('close', (code3) => {
      console.log("Exit!");
    });
  });
});