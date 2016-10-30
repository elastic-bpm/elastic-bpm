/*jshint esversion: 6 */

containers_init = function(socket, interval) {
    $.get("/parts/containers.html", (data) => {
        $("#containers").html(data);
    });

    show_containers_table();
    setInterval(show_containers_table, interval);
};

show_containers_table = function () {
    global_status_data.forEach((item) => {
        if (item.name === 'elastic-docker' && item.status === 200) {
            $.get("/parts/containers_info.html", (data) => {
                $("#containers-info").html(data);
                fill_containers_table();
            });
        } else if (item.name === 'elastic-docker'){
            $.get("/parts/containers_error.html", (data) => {
                $("#containers-info").html(data);
            });
        }
    });
};

fill_containers_table = function() {
    $.get("/containers", (data) => {
        $("#containers-table-body").loadTemplate("templates/containers-template.html", data);
    }).fail(() => {
        console.log("unable to get container data");
    });
};