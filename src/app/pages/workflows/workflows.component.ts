import { Component, OnInit } from '@angular/core';

import { WorkflowService } from '../../services/workflow.service';

import * as cytoscape from 'cytoscape';

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
  selectedWorkflow = {};
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

  fillModal(id) {
    this.selectedWorkflow = this.workflows.find((wf) => wf.id === id);
  }

  showGraph() {
    const container = document.getElementById('cy');
    if (container === null) {
      setTimeout(() => this.showGraph(), 100);
    } else {
      const options: Cy.CytoscapeOptions = {
        container: container,
        elements: [ // list of graph elements to start with
          { // node a
            data: { id: 'a' }
          },
          { // node b
            data: { id: 'b' }
          },
          { // edge ab
            data: { id: 'ab', source: 'a', target: 'b' }
          }
        ],
      };
      const cy = cytoscape(options);
    }
  }
}
