/*jshint esversion: 6 */

nodes_init = function(socket, interval) {
    $.get("/parts/nodes.html", (data) => {
        $("#nodes").html(data);

        update_node_table();
        setInterval(update_node_table, interval);
    });
};

var init_node_table_flag = false;
var data_node_table = {};
update_node_table = function() {
    if (!init_node_table_flag) {
        init_node_table();
    } else {
        data_node_table.ajax.reload();
    }
};

init_node_table = function() {
    data_node_table = $('#node-table').DataTable({
        "order": [ 0, 'asc' ],
        "searching": false,
        "paging": false,
        "ajax": {
            "url": "/nodes",
            "dataSrc": ""
        },
        "columns": [
            { "data": "hostname" },
            { "data": "id" },
            { "data": "availability" },
            { "data": "status" },
            {
                "data": null, 
                "render": function (data, type, full, meta) {
                    // GHETTO disable & OnClick :)
                    start_disabled = data.availability === "drain" ? "" : "disabled";
                    stop_disabled = data.availability === "active" ? "" : "disabled";
                    return "<button " +
                                "onclick=\"set_node_availability('"+data.hostname+"','active')\" "+
                                "class=\"btn btn-success btn-xs "+start_disabled+"\">set to active</button>&nbsp;" +
                            "<button "+
                                "onclick=\"set_node_availability('"+data.hostname+"','drain')\" "+
                                "class=\"btn btn-danger btn-xs "+stop_disabled+"\">set to drain</button>";
                }
            }
        ]
    });

    init_node_table_flag = true;
};

function set_node_availability(hostname, availability){
    console.log("Setting node " + hostname + " to " + availability);
    $.post( "node/" + hostname + "/" + availability, function( data ) {
        console.log("Result from set node: ");
        console.log(data);
    });
}