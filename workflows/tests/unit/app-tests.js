/*jshint esversion: 6 */

var proxyquire =  require('proxyquire');
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

var workflowsStub = {};
var app = proxyquire('../../app', {'./repository/workflows': workflowsStub});

test_flow =  {
    status: "enabled",
    state: "1",
    flow: "1:A -> 2:B -> 3:C",
    data: "A=B;F=G"
};

workflowsStub.create_workflow = function(wf, callback) {
  wf.created = (new Date()).toJSON();
  callback(null, wf);
};

workflowsStub.get_all_workflows = function(callback) {
  callback(null, [test_flow, test_flow]);
};

workflowsStub.get_workflow = function(id, callback) {
  callback(null, test_flow);
};

workflowsStub.update_workflow = function(workflow, callback) {
  callback(null, workflow);
};

describe('App', function() {
  it('app.post_workflows() should pass req.body, with created property', function(done) {
    
    req = {};
    req.body = test_flow;
    
    res = {};
    res.setHeader = function (){};
    res.send = function(obj_json) {
        obj = JSON.parse(obj_json);
        expect(obj).to.have.property('created');
        expect(obj.name).to.equal(req.body.name);
        done();
    };

    app.post_workflows(req, res);
  });

  it('app.get_workflows() should pass all workflows back to res', function(done) {

    res = {};
    res.setHeader = function (){};
    res.send = function(obj) {
        expect(obj).to.equal(JSON.stringify([test_flow, test_flow], null, 3));
        done();
    };

    app.get_workflows(req, res);
  });

  it('app.get_workflow_at() should return the requested workflow back to res', function(done) {

    req = {};
    req.params = {};
    req.params.workflowId = 0;

    res = {};
    res.setHeader = function (){};
    res.send = function(obj) {
        expect(obj).to.equal(JSON.stringify(test_flow, null, 3));
        done();
    };

    app.get_workflow_at(req, res);
  });

  it('app.update_workflow() should update the workflow and send it back to res', function(done) {

    req = {};
    req.body = test_flow;
    req.body.id = "workflow:0";
    req.params = {};
    req.params.workflowId = "workflow:0";

    res = {};
    res.setHeader = function (){};
    res.send = function(obj) {
        expect(obj).to.equal(JSON.stringify(test_flow, null, 3));
        done();
    };

    app.update_workflow(req, res);
  });
});