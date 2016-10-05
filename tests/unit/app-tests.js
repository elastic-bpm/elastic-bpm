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
  callback(wf);
};

workflowsStub.get_workflow = function(identifier, callback) {
  callback(test_flow);
};

describe('AppPostWorkflows', function() {
  it('app.post_workflows() should pass req.body, with created property', function(done) {
    
    req = {};
    req.body = test_flow;
    
    res = {};
    res.setHeader = function (){};
    res.send = function(obj) {
        expect(obj).to.have.property('created');
        expect(obj.name).to.equal(req.body.name);
        done();
    };

    app.post_workflows(req, res);
  });
});

describe('AppGetWorkflows', function() {
  it('app.get_workflows() should pass the first workflow back to res', function(done) {

    res = {};
    res.setHeader = function (){};
    res.send = function(obj) {
        expect(obj).to.equal(JSON.stringify(test_flow, null, 3));
        done();
    };

    app.get_workflows(req, res);
  });
});