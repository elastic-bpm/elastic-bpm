/*jshint esversion: 6 */

var proxyquire = require('proxyquire').noCallThru();
var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var assert = chai.assert;

input_workflow_tasks =  {
    id: "unique-guid",
    name: "wf1", 
    owner: "johannes",
    nodes: "A, B, C"
};
var workflowStub = {};
var tasks = proxyquire('../../logic/tasks', {'../repository/workflows': workflowStub});

describe('Tasks', function() {

    it('tasks.get_task() should give a current task', function(done) {
        workflowStub.get_all_workflows = function(callback) {
            callback(null, [input_workflow_tasks]);
        };

        tasks.get_task(function(err, output_task) {
            if (err) {
                assert.fail();
                done();
            } else {
                expect(output_task).to.have.property('workflow_id');
                done();
            }
        });
    });

    it('tasks.get_task() should give a message when not tasks', function(done){
        workflowStub.get_all_workflows = function(callback) {
            callback(null, []);
        };

        tasks.get_task(function(err, output_task) {
            if (err) {
                expect(err).to.equal("No more tasks");
                done();
            } else {
                assert.fail("Should not return workflows.");
                done();
            }
        });
    });


});