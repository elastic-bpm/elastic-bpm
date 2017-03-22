import { Component, OnInit } from '@angular/core';

import { WorkflowService } from '../../services/workflow.service';

import * as dagre from '../../../../node_modules/dagre/dist/dagre';
import * as cytoscape from '../../../../node_modules/cytoscape/dist/cytoscape';
import * as cytoscape_dagre from '../../../../node_modules/cytoscape-dagre/cytoscape-dagre';

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
    cytoscape_dagre(cytoscape, dagre);
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

  get_nodes = function (node_string, busy, done) {
    const nodes = [];
    const node_words = node_string.split(',').map(w => w.trim());

    node_words.forEach((word) => {
      let classes = '';
      if (busy.indexOf(word) > -1) {
        classes = 'busy';
      }

      if (done.indexOf(word) > -1) {
        classes = 'done';
      }

      const node = {
        data: { id: word },
        classes: classes,
      };
      nodes.push(node);
    });

    return nodes;
  };

  get_edges = function (edges_string) {
    const edges = [];
    const edge_words = edges_string.split(',').map(w => w.trim());

    edge_words.forEach((word) => {
      const elements = word.split('->').map(w => w.trim());

      edges.push({ data: { source: elements[0], target: elements[1] } });
    });

    return edges;
  };

  showGraph() {
    const container = document.getElementById('cy');
    if (container === null) {
      setTimeout(() => this.showGraph(), 100);
    } else {
      const edges = this.get_edges(this.selectedWorkflow['edges']);
      const nodes = this.get_nodes(
        this.selectedWorkflow['nodes'],
        this.selectedWorkflow['busy_nodes'],
        this.selectedWorkflow['done_nodes']
      );

      const options = {
        container: container,
        boxSelectionEnabled: false,
        autounselectify: true,
        layout: { name: 'dagre' },
        style: [
          {
            selector: 'node',
            style: {
              'content': 'data(id)',
              'text-opacity': 0.5,
              'text-valign': 'center',
              'text-halign': 'right',
              'background-color': '#11479e'
            }
          },
          {
            selector: '.busy',
            style: {
              'content': 'data(id)',
              'text-opacity': 0.5,
              'text-valign': 'center',
              'text-halign': 'right',
              'background-color': '#FF479e'
            }
          },
          {
            selector: '.done',
            style: {
              'content': 'data(id)',
              'text-opacity': 0.5,
              'text-valign': 'center',
              'text-halign': 'right',
              'background-color': '#11FF9e'
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 4,
              'target-arrow-shape': 'triangle',
              'line-color': '#9dbaea',
              'target-arrow-color': '#9dbaea',
              'curve-style': 'bezier'
            }
          }
        ],
        elements: { nodes: nodes, edges: edges },
      };
      const cy = cytoscape(options);
    }
  }
}
