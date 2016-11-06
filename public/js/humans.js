/*jshint esversion: 6 */

humans_init = function(socket, interval) {
    $.get("/parts/humans.html", (data) => {
        $("#humans").html(data);

        update_human_task_table();
        setInterval(update_human_task_table, interval);
    });
};

init_human_task_table_flag = false;
update_human_task_table = function() {
    if (!init_human_task_table_flag) {
        human_task_table = $('#human-tasks-table').DataTable({
            "order": [ 0, 'desc' ],
            "scrollY": "400px",
            "searching": false,
            "paging": false,
            "ajax": {
                "url": "/tasks/human",
                "dataSrc": ""
            },
            "columns": [
                { "data": "created", "render": function ( data, type, full, meta ) {return new Date(data).toLocaleString();} },
                { "data": "id" },
                { "data": "state"},
                { "data": "difficulty" },
                {
                    "data": null, 
                    "render": function (data, type, full, meta) {
                        // GHETTO disable & OnClick :/
                        start_disabled = data.state === "todo" ? "" : "disabled";
                        stop_disabled = data.state === "busy" ? "" : "disabled";
                        return "<button id=\"start-task-"+data.id+"\" onclick=\"start_human_task('"+data.id+"')\" class=\"btn btn-success "+start_disabled+"\">Start task</button>&nbsp;" +
                        "<button id=\"finish-task-"+data.id+"\" onclick=\"stop_human_task('"+data.id+"')\" class=\"btn btn-danger "+stop_disabled+"\">Finish task</button>";
                    }
                }
            ]
        });

        init_human_task_table_flag = true;
    } else {
        human_task_table.ajax.reload(null, false);
    }
};

start_human_task = function(id) {
    alert("Starting task " + id);
};

stop_human_task = function(id) {
    alert("Stopping task " + id);
};