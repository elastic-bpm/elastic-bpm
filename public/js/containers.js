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
            $("#containers-info").html("");

            fill_containers_table();
            fill_docker_info();
        } else if (item.name === 'elastic-docker'){
            $.get("/parts/containers_error.html", (data) => {
                $("#containers-info").html(data);
            });
        }
    });
};

fill_containers_table = function() {
    $.get("/containers/local", (data) => {
        $("#local-containers-table-body").loadTemplate("templates/containers-template.html", data);
    }).fail(() => {
        console.log("unable to get local container data");
    });

    $.get("/containers/remote", (data) => {
        $("#remote-containers-table-body").loadTemplate("templates/containers-template.html", data);
    }).fail(() => {
        console.log("unable to get remote container data");
    });
};

$.addTemplateFormatter({
    JSONDateToString: function(value, template) {
        return new Date(value).toLocaleString();
    }
});

fill_docker_info = function() {
    $.get("/docker_info/local", (data) => {
        $("#tab-docker-info-local").loadTemplate("templates/docker-info-template.html", data);
    }).fail(() => {
        console.log("unable to get local docker info");
    });

    $.get("/docker_info/remote", (data) => {
        $("#tab-docker-info-remote").loadTemplate("templates/docker-info-template.html", data);
    }).fail(() => {
        console.log("unable to get remote docker info");
    });
};