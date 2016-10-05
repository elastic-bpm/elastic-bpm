var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var app = require('../app');

describe('CreateWorkflow', function() {
  it('app.create_workflow() should have a created field', function() {
    input_workflow =  {
        name: "wf1", 
        owner: "johannes",
        description: "A -> B -> C"
    };
    
    app.create_workflow(input_workflow, function(output_workflow) {
      expect(output_workflow).to.have.property('created');
    }); 
  });
});