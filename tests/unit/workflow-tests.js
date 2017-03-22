/*jshint esversion: 6 */

var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

input_workflow =  {
    name: "wf1", 
    owner: "johannes",
    edges: "A:CC:S -> B:HE:15",
    nodes: "A:CC:S, B:HE:15"
};

wfs = {
  'workflows:0': JSON.stringify(input_workflow),
  'workflows:1': JSON.stringify(input_workflow)
};

var redisStub = {};
redisStub.createClient = function(){return redisStub;};
redisStub.sadd = function(identifier, value) {return 'Ok.';};
redisStub.publish = function (channel, message) {return 'Ok.';};
redisStub.smembers = function (identifier, callback){ callback(null, ["workflows:0", "workflows:1"]);};

redisStub.set = function (identifier, item, callback) {
  callback();
};

redisStub.get = function (identifier, callback) {
  callback(null, JSON.stringify(input_workflow));
};

var workflows = proxyquire('../../repository/workflows', {'redis': redisStub});

describe('Workflows', function() {
  it('workflows.create_workflow() should have a created field', function() {
    input_workflow =  {
        name: "wf1", 
        owner: "johannes",
        edges: "A:CC:S -> B:HE:15",
        nodes: "A:CC:S, B:HE:15"
    };
    redisStub.set = function (identifier, item, callback) {
      input_workflow = JSON.parse(item);
      callback();
    };
    redisStub.get = function (identifier, callback) {
      callback(null, JSON.stringify(input_workflow));
    };
    workflows.create_workflow(JSON.parse(JSON.stringify(input_workflow)), function(err, output_workflow) {
      expect(output_workflow).to.have.property('created');
    }); 
  });

  it('workflows.get_workflow() should return the workflow required', function() {
    workflows.get_workflow('workflows:0', function(err, output_workflow) {
      expect(JSON.stringify(output_workflow)).to.equal(JSON.stringify(input_workflow));
    }); 
  });

  it('workflows.get_all_workflows() should return all the workflows', function() {
    workflows.get_all_workflows(function(err, output_workflows) {
      expect(output_workflows).to.have.lengthOf(2);
      expect(JSON.stringify(output_workflows[0])).to.equal(JSON.stringify(input_workflow));
    }); 
  });

  it('workflows.update_workflow() should update the workflow', function() {
    workflows.update_workflow(JSON.parse(JSON.stringify(input_workflow)), function(err, output_workflow) {
      expect(JSON.stringify(output_workflow)).to.equal(JSON.stringify(input_workflow));
    });
  });
});