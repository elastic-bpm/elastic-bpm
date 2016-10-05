var proxyquire =  require('proxyquire').noPreserveCache();;
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai

var workflowsStub = {};
var app = proxyquire('../../app', {'./repository/workflows': workflowsStub});

workflowsStub.create_workflow = function(wf, callback) {
  wf.created = (new Date()).toJSON();
  callback(wf);
};

describe('PostWorkflows', function() {
  it('app.post_workflows() should pass req.body, with created property', function(done) {
    
    req = {};
    req.body = {
        status: "enabled",
        state: "1",
        flow: "1:A -> 2:B -> 3:C",
        data: "A=B;F=G"
    };
    
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