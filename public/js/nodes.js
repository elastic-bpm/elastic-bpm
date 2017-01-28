/*jshint esversion: 6 */

nodes_init = function(socket, interval) {
    $.get("/parts/nodes.html", (data) => {
        $("#nodes").html(data);
    });

    //show_machines_table();
    //setInterval(show_machines_table, interval);
};
