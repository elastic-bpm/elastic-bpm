var proxyquire = require('proxyquire').noCallThru().noPreserveCache();; // Stubbing redis, so no sneaky calls please :-)
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

input_workflow =  {
    name: "wf1", 
    owner: "johannes",
    description: "A -> B -> C"
};

var redisStub = {};
redisStub.createClient = function(){return redisStub;};
redisStub.incr = function (identifier, callback) {callback('0');};

redisStub.hmset = function (identifier, item, callback) {
  temp_flow = item;
  callback();
};

redisStub.hgetall = function (identifier, callback) {
  callback(null, temp_flow);
};
var workflows = proxyquire('../../repository/workflows', {'redis': redisStub});

describe('CreateWorkflow', function() {
  it('workflows.create_workflow() should have a created field', function() {
    workflows.create_workflow(input_workflow, function(output_workflow) {
      expect(output_workflow).to.have.property('created');
    }); 
  });
});