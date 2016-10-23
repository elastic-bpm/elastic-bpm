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
    },
    WorkflowGraph: function(value, template) {
        return value + "-graph";
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

var cy = {};
init_graph = function(elementId, nodes, edges) {
    cy[elementId] = cytoscape({
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
workflow_graphs_shown = false;

get_nodes = function(node_string) {
    nodes = [];
    
    node_words = node_string.split(",");
    node_words.forEach((word) => {
        node = {data: {id : word.trim()}};
        nodes.push(node);
    });

    // console.log("Nodes: " + JSON.stringify(nodes));
    return nodes;
};

get_edges = function(edges_string) {
    edges = [];

    edge_words = edges_string.split(",");
    edge_words.forEach((word) => {
        elements = word.split("->");

        edge = {data:{source: elements[0].trim(), target: elements[1].trim()}};
        edges.push(edge);
    });

    // console.log("Edges: " + JSON.stringify(edges));
    return edges;
};

fill_template = function (workflows) {
    if (!workflow_graphs_shown) {
        $("#workflows-modal").loadTemplate("templates/workflow-graph-template.html", workflows, {success: () => {
            workflows.forEach((item) => {
                nodes = get_nodes(item.nodes);
                edges = get_edges(item.edges);
                init_graph(item.id+"-graph", nodes, edges);

                $('#' + item.id + '-modal').on('shown.bs.modal', function () {
                    cy[item.id+"-graph"].resize();
                    cy[item.id+"-graph"].fit();
                });
            });

            workflow_graphs_shown = true; 
        }});
    }

    $("#workflows-table-body").loadTemplate("templates/workflows-template.html", workflows, {success: () => {
        workflows.forEach((item) => {
            $("#delete-workflow-" + item.id + "-button").on('click', (event) => delete_workflow(item.id));
        });
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