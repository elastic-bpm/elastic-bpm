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
                { "data": "workflow_id" },
                { "data": "task_id" },
                { "data": "task_status"},
                {
                    "data": null, 
                    "render": function (data, type, full, meta) {
                        // GHETTO disable & OnClick :/
                        start_disabled = data.task_status === "todo" ? "" : "disabled";
                        stop_disabled = data.task_status === "busy" ? "" : "disabled";
                        return "<button " +
                                    "id=\"start-task-"+data.task_id+"\" "+
                                    "onclick=\"start_human_task('"+data.workflow_id+"','"+data.task_id+"')\" "+
                                    "class=\"btn btn-success "+start_disabled+"\">Start task</button>&nbsp;" +
                                "<button "+
                                    "id=\"finish-task-"+data.task_id+"\" "+
                                    "onclick=\"stop_human_task('"+data.workflow_id+"','"+data.task_id+"')\" "+
                                    "class=\"btn btn-danger "+stop_disabled+"\">Finish task</button>";
                    }
                }
            ]
        });

        init_human_task_table_flag = true;
    } else {
        human_task_table.ajax.reload(null, false);
    }
};

start_human_task = function(workflow_id, task_id) {
    console.log("Starting task: " + task_id + ", from workflow: " + workflow_id);
    $.post( "/task/"+workflow_id+"/"+task_id+"/busy", function( data ) {
        console.log(data);
        update_human_task_table();
    });
};

stop_human_task = function(workflow_id, task_id) {
    console.log("Stopping task: " + task_id + ", from workflow: " + workflow_id);
    $.post( "/task/"+workflow_id+"/"+task_id, function( data ) {
        console.log(data);
        update_human_task_table();
    });
};