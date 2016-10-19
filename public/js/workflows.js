/*jshint esversion: 6 */

workflows_init = function (socket, interval) {
    show_workflows();
    setInterval(show_workflows, interval);
};

$.addTemplateFormatter({
    WorkflowDeleteButton: function(value, template) {
        return "delete-workflow-" + value + "-button";
    },
    WorkflowModal: function(value, template) {
        if (template) {
            return template + value + "-modal";
        } else {
            return value + "-modal";
        }
    }
});

create_workflow = function() {
    var name = $("#workflow-name").val();
    var owner = $("#workflow-owner").val();
    var edges = $("#workflow-edges").val();
    var nodes = $("#workflow-nodes").val();

    // Elaborate post, because I want to use the body
    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify({"name": name, "owner": owner, "edges": edges, "nodes": nodes}),
        success: function(data){
            console.log(data);
            $('#workflow-create-form').trigger('reset');
            show_workflows();
        },
        error: function(error){
            console.log(error);
        },
        type: 'POST',
        url: '/workflows'
    });
};

delete_workflow = function(workflow_id) {
    $.ajax({
        success: function(data){
            console.log(data);
            show_workflows();
        },
        error: function(error){
            console.log(error);
        },
        type: 'DELETE',
        url: '/workflows/' + workflow_id
    });
};

init_graph = function(elementId, nodes, edges) {
    console.log(elementId);
    var cy = window.cy = cytoscape({
        container: document.getElementById(elementId),

        boxSelectionEnabled: false,
        autounselectify: true,

        layout: {
            name: 'dagre'
        },

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

        elements: {nodes: nodes, edges: edges},
    });
};

workflow_template_shown = false;
fill_template = function (workflows) {
    $("#workflows-modal").loadTemplate("templates/workflow-graph-template.html", workflows, {success: () => {
        nodes = [
            { data: { id: 'n0' } },
            { data: { id: 'n1' } },
            { data: { id: 'n2' } },
            { data: { id: 'n3' } }
        ];
        edges = [
            { data: { source: 'n0', target: 'n1' } },
            { data: { source: 'n1', target: 'n2' } },
            { data: { source: 'n1', target: 'n3' } }
        ];

        workflows.forEach((item) => {
            init_graph('cy', nodes, edges);
        }); 

        $("#workflows-table-body").loadTemplate("templates/workflows-template.html", workflows, {success: () => {
            workflows.forEach((item) => {
                $("#delete-workflow-" + item.id + "-button").on('click', (event) => delete_workflow(item.id));
            });
        }});

    }});
};

show_workflows = function() {
    $.get('/workflows', (workflows) => {
        if (!workflow_template_shown) {
            $.get("/parts/workflows.html", (data) => {
                $("#workflows").html(data);
                $("#workflow-create-button").on('click', create_workflow);
                workflow_template_shown = true;
                fill_template(workflows);       
            });
        } else {
            fill_template(workflows);
        }
    }).fail(() => {
        $.get("/parts/workflows_error.html", (data) => {
                $("#workflows").html(data);
        });
        workflow_template_shown = false;
    });
};