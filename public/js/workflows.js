/*jshint esversion: 6 */

workflows_init = function (socket, interval) {
    $.get("/parts/workflows.html", (data) => {
        $("#workflows").html(data);
        $("#workflow-create-button").on('click', create_workflow_from_form);
    });

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
    },
    ListToAmount: function(value, template) {
        return value.length;
    }
});

post_workflow = function(name, owner, edges, nodes, callback) {
    // Elaborate post, because I want to use the body
    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify({"name": name, "owner": owner, "edges": edges, "nodes": nodes}),
        success: function(data){
            callback(data);
        },
        error: function(error){
            console.log(error);
        },
        type: 'POST',
        url: '/workflows'
    });
};

create_workflow_from_form = function() {
    var name = $("#workflow-name").val();
    var owner = $("#workflow-owner").val();
    var edges = $("#workflow-edges").val();
    var nodes = $("#workflow-nodes").val();

    post_workflow(name, owner, edges, nodes, (data) => {
        $('#workflow-create-form').trigger('reset');
        show_workflows();
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

        elements: {nodes: nodes, edges: edges},
    });
};

get_nodes = function(node_string, busy, done) {
    nodes = [];
    
    node_words = node_string.split(",").map(w => w.trim());
    node_words.forEach((word) => {
        classes = '';
        if (busy.indexOf(word) > -1) {
            classes = 'busy';
        }

        if (done.indexOf(word) > -1) {
            classes = 'done';
        }

        node = {
            data: {id : word},
            classes: classes,
        };
        nodes.push(node);
    });

    // console.log("Nodes: " + JSON.stringify(nodes));
    return nodes;
};

get_edges = function(edges_string) {
    edges = [];

    edge_words = edges_string.split(",").map(w => w.trim());
    edge_words.forEach((word) => {
        elements = word.split("->").map(w => w.trim());

        edge = {data:{source: elements[0], target: elements[1]}};
        edges.push(edge);
    });

    // console.log("Edges: " + JSON.stringify(edges));
    return edges;
};

show_graph_for_workflow = function(item) {
    nodes = get_nodes(item.nodes, item.busy_nodes, item.done_nodes);
    edges = get_edges(item.edges);
    init_graph(item.id+"-graph", nodes, edges);

    $('#' + item.id + '-modal').on('shown.bs.modal', function () {
        cy[item.id+"-graph"].resize();
        cy[item.id+"-graph"].fit();
    });
};

show_graphs = function (workflows) {
    workflows.forEach((item) => {
        if (!$("#"+item.id+"-modal").length) {
            $("#workflows-modal").loadTemplate("templates/workflow-graph-template.html", item, {append: true, success: () => {
                show_graph_for_workflow(item);
            }});
        } else {
            show_graph_for_workflow(item);
        }
    });
};

init_workflow_table_flag = false;
data_workflow_table = {};
init_workflow_table = function() {
    if (!init_workflow_table_flag) {
        data_workflow_table = $('#workflow-table').DataTable({
            "order": [ 0, 'desc' ],
            "scrollY": "400px",
            "paging": false,
            "ajax": {
                "url": "/workflows",
                "dataSrc": ""
            },
            "columns": [
                { "data": "created", "render": function ( data, type, full, meta ) {return new Date(data).toLocaleString();} },
                { "data": "id", "render": function ( data, type, full, meta ) {return '<abbr title="'+ data +'">'+ data.substring(0,8) +'</abbr>';} },
                { "data": "name" },
                { "data": "owner" },
                { "data": null, "defaultContent": "<button data-action='show' class='btn btn-primary btn-sm'>Graph</button>" },
                { "data": "status" },
                { "data": "todo_nodes", "render": function ( data, type, full, meta ) {return data.length;} },
                { "data": "busy_nodes", "render": function ( data, type, full, meta ) {return data.length;} },
                { "data": "done_nodes", "render": function ( data, type, full, meta ) {return data.length;} },
                { "data": null, "defaultContent": "<button data-action='delete' class='btn btn-danger btn-circle'><i class='fa fa-stop'></i></button>" }
            ]
        });

        $('#workflow-table tbody').on( 'click', 'button', function () {
            var data = data_workflow_table.row( $(this).parents('tr') ).data();
            var actionString = $(this).data( "action" ); 

            if(actionString === 'delete'){
                delete_workflow(data.id);
                data_workflow_table.ajax.reload(null, false);
            } else if (actionString === 'show') {
                $('#' + data.id + '-modal').modal('show'); 
            }
        } );

        init_workflow_table_flag = true;
    } else {
        data_workflow_table.ajax.reload(null, false);
    }
};

show_workflows = function() {
    $.get('/workflows', (workflows) => {
        show_graphs(workflows);
        init_workflow_table();
    }).fail(() => {
        $("#workflows-info").loadTemplate("templates/workflows-error.html");
    });
};