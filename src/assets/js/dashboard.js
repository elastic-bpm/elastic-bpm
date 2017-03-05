/*jshint esversion: 6 */

dashboard_init = function (socket, interval) {
    $.get("/parts/dashboard.html", (data) => {
        $("#dashboard").html(data);
    });

    load_status();
    setInterval(load_status, interval);
};

load_status = function () {
    $.get('/status', (status_data) => {
        global_status_data = status_data.map((obj) => {
            if (obj.status == 200) {
                obj.class = "glyphicon-ok-sign good";
            } else {
                obj.class = "glyphicon-remove-sign bad";
            }
            return obj;
        });
        $("#dashboard-status").loadTemplate("templates/widget-template.html", global_status_data);
    });
};