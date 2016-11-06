/*jshint esversion: 6 */

workers_init = function(socket, interval) {
    $.get("/parts/workers.html", (data) => {
        $("#workers").html(data);

        $("#worker-amount").slider();
        $("#worker-amount").on("slide", function(slideEvt) {
            $("#worker-amount-value").text(slideEvt.value);
        });

        $("#scale-workers-button").on("click", function() {
            scale_workers($("#worker-amount").val(), () => {});
        });

        $("#reset-workers-service-button").on("click", function() {
            reset_workers(() => {});
        });

        show_workers_table();
        setInterval(show_workers_table, interval);
    });
};

delete_workers = function(callback) {
    $.ajax({
        contentType: 'application/json',
        success: function(data){
            callback();
        },
        error: function(error){
            console.log(error);
        },
        type: 'DELETE',
        url: '/services/workers'
    });
};

create_workers = function(callback) {
    $.ajax({
        contentType: 'application/json',
        success: function(data){
            callback();
        },
        error: function(error){
            console.log(error);
        },
        type: 'POST',
        url: '/services/workers'
    });
};

reset_workers = function(callback) {
    delete_workers(() => {
        create_workers(callback);
    });
};

scale_workers = function(amount, callback) {
    // Elaborate PUT, because I want to use the body
    $.ajax({
        contentType: 'application/json',
        data: JSON.stringify({"scale": amount}),
        success: function(data){
            callback(data);
        },
        error: function(error){
            console.log(error);
        },
        type: 'PUT',
        url: '/services/workers'
    });
};

show_workers_table = function () {
    global_status_data.forEach((item) => {
        if (item.name === 'elastic-docker' && item.status === 200) {
            $("#workers-info").html("");
            update_workers_info();
            init_workers_table();
        } else if (item.name === 'elastic-docker'){
            $.get("/parts/workers_error.html", (data) => {
                $("#workers-info").html(data);
            });
        }
    });
};

update_workers_info = function() {
    $.get("/services", (data) => {
        elastic_service_info = data.find((item) => item.Spec.Name === "elastic-workers");
        if (elastic_service_info !== undefined) {
            $("#current-worker-amount").html(elastic_service_info.Spec.Mode.Replicated.Replicas);
        }
    }).fail(() => {
        console.log("unable to get remote service data");
    });
};

init_workers_table_flag = false;
data_workers_table = {};
init_workers_table = function() {
    if (!init_workers_table_flag) {
        data_workers_table = $('#workers-table').DataTable({
            "order": [ 0, 'desc' ],
            "scrollY": "400px",
            "searching": false,
            "paging": false,
            "ajax": {
                "url": "/workers",
                "dataSrc": ""
            },
            "columns": [
                { "data": "CreatedAt", "render": function ( data, type, full, meta ) {return new Date(data).toLocaleString();} },
                { "data": "ID" },
                { "data": "NodeID" },
                { "data": "DesiredState" },
                { "data": "Status.State" },
                { "data": "Status.Err" }
            ],
            "rowCallback": function( row, data, index ) {
                $(row).removeClass('info warning success');
                if (data.Status.State === "shutdown") {
                    $(row).addClass('warning');
                } else if (data.Status.State === "running") {
                    $(row).addClass('success');
                } else {
                    $(row).addClass('info');
                }
            }
        });

        init_workers_table_flag = true;
    } else {
        data_workers_table.ajax.reload(null, false);
    }
};