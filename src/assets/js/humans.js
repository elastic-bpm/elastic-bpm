/*jshint esversion: 6 */

humans_init = function(socket, interval) {
    $.get("/parts/humans.html", (data) => {
        $("#humans").html(data);

        $("#humans-on-time").slider();
        $("#humans-off-time").slider();
        $("#humans-init-time").slider();
        $("#humans-total-time").slider();
        $("#humans-amount").slider();

        $("#start-humans-button").on('click', () => {
            var data = { 
                on: $("#humans-on-time").val(), 
                off: $("#humans-off-time").val(),
                init: $("#humans-init-time").val(), 
                total: $("#humans-total-time").val(),
                amount: $("#humans-amount").val()
            };
            start_humans(data, (r) => console.log(r));
        });

        update_human_task_table();
        setInterval(update_human_task_table, interval);

        update_human_info();
        setInterval(update_human_info, interval);
    });
};

start_humans = function(data, callback) {
    $.ajax({
        type: "POST",
        url: "/starthumans",
        processData: false,
        contentType: 'application/json',
        data: JSON.stringify(data),
        success: function(r) {
            callback(r);
        }
    });
};

update_human_info = function() {
    $.get('/human/info', function(data) {
        start_moment = moment(data.startTime);
        $("#humans-info-started").html("<abbr title="+start_moment.format()+">"+start_moment.fromNow()+"</abbr>");
        $("#humans-info-amount").html(data.humans);

        var next_moment = null;
        if (moment(data.startTime + data.initTime).isAfter()) {
            $("#humans-info-paused").html("not init yet");
            $("#humans-info-next-text").html("Time to init:");
            next_moment = moment(data.startTime + data.initTime);
        } else {
            if (data.paused) {
                $("#humans-info-paused").html("paused");
                $("#humans-info-next-text").html("Time to active:");
                next_moment = moment(data.switchTime + data.offTime);
            } else {
                $("#humans-info-paused").html("active");
                $("#humans-info-next-text").html("Time to pause:");
                next_moment = moment(data.switchTime + data.onTime);
            }
        }
        $("#humans-info-next").html("<abbr title="+next_moment.format()+">"+next_moment.fromNow()+"</abbr>");

        total_moment = moment(data.startTime + data.totalTime);
        $("#humans-info-total").html("<abbr title="+total_moment.format()+">"+total_moment.fromNow()+"</abbr>");
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