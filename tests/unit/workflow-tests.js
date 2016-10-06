var proxyquire = require('proxyquire');
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

input_workflow =  {
    name: "wf1", 
    owner: "johannes",
    description: "A -> B -> C"
};

wfs = {
  'workflows:0': input_workflow,
  'workflows:1': input_workflow
};

var redisStub = {};
redisStub.createClient = function(){return redisStub;};
redisStub.incr = function (identifier, callback) {callback('1');};

redisStub.get = function (identifier, callback) {callback(null, '2');};

redisStub.hmset = function (identifier, item, callback) {
  wfs[identifier] = item;
  callback();
};

redisStub.hgetall = function (identifier, callback) {
  callback(null, wfs[identifier]);
};
var workflows = proxyquire('../../repository/workflows', {'redis': redisStub});

describe('Workflows', function() {
  it('workflows.create_workflow() should have a created field', function() {
    workflows.create_workflow(input_workflow, function(output_workflow) {
      expect(output_workflow).to.have.property('created');
    }); 
  });

  it('workflows.get_workflow() should return the workflow required', function() {
    workflows.get_workflow('0', function(output_workflow) {
      expect(output_workflow).to.equal(input_workflow);
    }); 
  });

  it('workflows.get_all_workflows() should return all the workflows', function() {
    workflows.get_all_workflows(function(output_workflows) {
      expect(output_workflows).to.have.lengthOf(2);
      expect(output_workflows[0]).to.equal(input_workflow);
    }); 
  });
});