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
redisStub.hgetall = function (identifier, callback) {
  callback(null, input_workflow);
};
var workflows = proxyquire('../../repository/workflows', {'redis': redisStub});

describe('GetWorkFlow', function() {
  it('workflows.get_workflow() should return the workflow required', function() {
    workflows.get_workflow(input_workflow, function(output_workflow) {
      expect(output_workflow).to.equal(input_workflow);
    }); 
  });
});