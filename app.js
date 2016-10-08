const subscriptionId = '849bd443-6f96-44ae-bcc9-e5295698e1f9';
const resourceGroupName = 'dockerswarmrg303651';
const labName = 'DockerSwarm';

 // Interactive Login
 // It provides a url and code that needs to be copied and pasted in a browser and authenticated over there. If successful, 
 // the user will get a DeviceTokenCredentials object.
var msRestAzure = require('ms-rest-azure');
var resourceManager = require('azure-arm-resource');
var util = require('util');
msRestAzure.interactiveLogin(function(err, credentials, subscriptions) {
  if (err) {
     console.log(err);
     return;
  }
  console.log('Credentials object:\n' + util.inspect(credentials, {depth: null }));
  console.log('List of subscriptions:\n' + util.inspect(subscriptions, {depth: null }));
  var client = new resourceManager.ResourceManagementClient(credentials, subscriptionId);
  client.resourceGroups.list(function (err, result, request, response) {
 if (err) {
    console.log(err);
  } else {
    console.log('>>>List of ResourceGroups:');
    console.log(result);
  }
 });
});