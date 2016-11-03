/*jshint esversion: 6 */

workers_init = function(socket, interval) {
    $.get("/parts/workers.html", (data) => {
        $("#workers").html(data);
    });

    show_workers_table();
    setInterval(show_workers_table, interval);
};

show_workers_table = function () {
    global_status_data.forEach((item) => {
        if (item.name === 'elastic-docker' && item.status === 200) {
            $("#workers-info").html("");
            init_workers_table();
        } else if (item.name === 'elastic-docker'){
            $.get("/parts/workers_error.html", (data) => {
                $("#workers-info").html(data);
            });
        }
    });
};

init_workers_table_flag = false;
data_workers_table = {};
init_workers_table = function() {
    if (!init_workers_table_flag) {
        data_workers_table = $('#workers-table').DataTable({
            "ajax": {
                "url": "/workers",
                "dataSrc": ""
            },
            "columns": [
                { "data": "ID" },
                { "data": "NodeID" },
                { "data": "DesiredState" },
                { "data": "Status.State" },
                { "data": "Status.Err" }
            ]
        });

        init_workers_table_flag = true;
    } else {
        data_workers_table.ajax.reload();
    }
};