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
            fill_workers();
        } else if (item.name === 'elastic-docker'){
            $.get("/parts/workers_error.html", (data) => {
                $("#workers-info").html(data);
            });
        }
    });
};

fill_workers = function() {
 $.get("/workers", (data) => {
        $("#workers-table-body").loadTemplate("templates/workers-template.html", data);
    }).fail(() => {
        console.log("unable to get remote workers data");
    });
};
