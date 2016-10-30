/*jshint esversion: 6 */

machines_init = function(socket, interval) {
    $.get("/parts/machines.html", (data) => {
        $("#machines").html(data);
    });

    show_machines_table();
    setInterval(show_machines_table, interval);
};

show_machines_table = function () {
    global_status_data.forEach((item) => {
        if (item.name === 'elastic-scaling' && item.status === 206) {
            $.get("/parts/machines_login.html", (data) => {
                $("#machines-info").html(data);
                new Clipboard('#azure_login_button');
                $("#azure_login_code").html(item.message);
            });
            $("#azure_login_code").html(item.message);
        } else if (item.name === 'elastic-scaling' && item.status === 200) {
            $("#machines-info").html("");
            fill_machines_table();
        } else if (item.name === 'elastic-scaling'){
            $.get("/parts/machines_error.html", (data) => {
                $("#machines-info").html(data);
            });
        }
    });
};

fill_machines_table = function () {
    $.get('/virtualmachines', (status_data) => {
        $("#machines-table-body").loadTemplate("templates/machines-template.html", status_data, {success: () => {
            status_data.forEach((obj) => {
                $("#start-button-" + obj.name).on('click', () => start_machine(obj.vmId));
                $("#pause-button-" + obj.name).on('click', () => pause_machine(obj.vmId));
            });
        }});
    }).fail(() => {
        console.log("unable to get VM data");
    });
};

$.addTemplateFormatter({
    ButtonId: function(value, template) {
        return template + "-button-" + value;
    },
    StartIsDisabled: function(value, template) {
        if (value === "VM running") {
            return template + " disabled";
        } else {
            return template;
        }
    },
    PauseIsDisabled: function(value, template) {
        if (value === "VM running") {
            return template;
        } else {
            return template + " disabled";
        }
    },
    StopIsDisabled: function(value, template) {
        return template + " disabled";
    }
});

start_machine = function(machine_id) {
    $.post( "/virtualmachines/"+machine_id+"/start" ).done(function( data ) {
        console.log(data);
    });
};

pause_machine = function(machine_id) {
    $.post( "/virtualmachines/"+machine_id+"/stop" ).done(function( data ) {
        console.log(data);
    });
};