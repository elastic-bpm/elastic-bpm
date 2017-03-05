import { Component, OnInit } from '@angular/core';

import { WorkflowService } from '../../services/workflow.service';

const testFlow = {
  name: 'Test-Workflow',
  owner: 'test',
  edges: 'A:CC:S -> B:HE:5, B:HE:5 -> C:CC:M',
  nodes: 'A:CC:S, B:HE:5, C:CC:M'
};

@Component({
  selector: 'app-workflows',
  templateUrl: './workflows.component.html',
  styleUrls: ['./workflows.component.css']
})
export class WorkflowsComponent implements OnInit {
  title = 'Workflows';
  workflows = [];
  constructor(private workflowService: WorkflowService) { }

  ngOnInit() {
    this.workflowService.workflows.subscribe(workflows => this.workflows = workflows);
  }


  createTestFlow() {
    this.workflowService.createWorkflow(testFlow, (error, data) => {
      if (error) {
        console.log('Error while creating workflow!');
        console.log(error);
      }
    });
  }

  createFlowFromFile() {
    console.log('Create flow from file');
  }

  deleteAllWorkflows() {
    this.workflowService.deleteAllWorkflows((error, data) => {
      if (error) {
        console.log('Error while deleting all workflows!');
        console.log(error);
      }
    });
  }

  deleteWorkflow(workflowId) {
    this.workflowService.deleteWorkflow(workflowId, (error, data) => {
      if (error) {
        console.log('Error while deleting workflow: ' + workflowId);
        console.log(error);
      }
    });
  }

  fileChanged(event) {
    console.log(event.target.files[0]);
    this.workflowService.uploadWorkflowScript(event.target.files[0], (error) => {
      if (error) {
        console.log('Error while uploading workflowscript.');
        console.log(error);
      }
    });
  }
}
