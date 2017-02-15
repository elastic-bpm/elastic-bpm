/*jshint esversion: 6 */

scheduler_init = function(socket, interval) {
    $.get("/parts/scheduler.html", (data) => {
        $("#scheduler").html(data);

        $("#scheduler-policy").on('change', (event) => {
            new_policy = $('#scheduler-policy :selected').text();
            if (new_policy !== '- pick -') {
                scheduler_update_policy(new_policy);
            }
        });

        $("#set-at-start-amount").slider();
        $("#set-at-start-amount-button").on('click', function(event) {
            scheduler_set_amount("atstart", $("#set-at-start-amount").val());
        });

        $("#set-on-demand-amount").slider();
        $("#set-on-demand-amount-button").on('click', function(event) {
            scheduler_set_amount("ondemand", $("#set-on-demand-amount").val());
        });


        $("#set-learning-amount").slider();
        $("#set-learning-amount-button").on('click', function(event) {
            scheduler_set_amount("learning", $("#set-learning-amount").val());
        });

        $("#scheduler-atstart-execution").on('click', function(event) {
            scheduler_start_execution('AtStart');
        });

        $("#scheduler-reset-execution").on('click', function(event) {
            scheduler_reset_execution();
        });

        update_scheduler_info();
        setInterval(update_scheduler_info, interval);
        console.log("Scheduler init");
    });
};

scheduler_reset_execution = function() {
    reset_workers(() => {});
    scheduler_delete_all_workflows();
    scheduler_update_policy("Off");

    $("#scheduler-set-policy").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-wait-machines").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-wait-nodes").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-reset-workers-1").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-scale-workers").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-start-humans").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-upload-workflow").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-wait-for-finished").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-reset-workers-2").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-delete-workflows").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
    $("#scheduler-set-policy-off").removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o");
};

scheduler_start_execution = function(policy) {
    scheduler_update_policy(policy);
    $("#scheduler-set-policy").removeClass("fa-circle-o").addClass("fa-check-circle-o");
    $("#scheduler-wait-machines").removeClass("fa-circle-o").addClass("fa-circle-o-notch fa-spin fa-fw");

    if (policy === "AtStart") {
        setTimeout(() => scheduler_wait_for_machines($("#scheduler-get-amount-at-start").val()), 1000);
    }
    if (policy === "OnDemand") {
        setTimeout(() => scheduler_wait_for_machines($("#scheduler-get-amount-on-demand").val()), 1000);
    }
    if (policy === "Learning") {
        setTimeout(() => scheduler_wait_for_machines($("#scheduler-get-amount-learning").val()), 1000);
    }
};

scheduler_wait_for_machines = function(target_machines) {
    if (target_machines == $("#scheduler-get-machines").val()) {
        $("#scheduler-wait-machines").removeClass("fa-circle-o-notch fa-spin fa-fw").addClass("fa-check-circle-o");
        $("#scheduler-wait-nodes").removeClass("fa-circle-o").addClass("fa-circle-o-notch fa-spin fa-fw");
        scheduler_wait_for_nodes(target_machines);
    } else {
        setTimeout(() => scheduler_wait_for_machines(target_machines), 1000);
    }
};

scheduler_wait_for_nodes = function(target_nodes) {
    if (target_nodes == $("#scheduler-get-ready-nodes").val()) {
        $("#scheduler-wait-nodes").removeClass("fa-circle-o-notch fa-spin fa-fw").addClass("fa-check-circle-o");
        reset_workers(() => {
            $("#scheduler-reset-workers-1").removeClass("fa-circle-o").addClass("fa-check-circle-o");
            $("#scheduler-scale-workers").removeClass("fa-circle-o").addClass("fa-circle-o-notch fa-spin fa-fw");
            setTimeout(() => scheduler_scale_workers(4), 5000);
        });
    } else {
        setTimeout(() => scheduler_wait_for_nodes(target_nodes), 1000);
    }
};

scheduler_scale_workers = function(amount) {
    scale_workers(amount, () => {
        $("#scheduler-scale-workers").removeClass("fa-circle-o-notch fa-spin fa-fw").addClass("fa-check-circle-o");
        scheduler_start_humans();          
    });
};

scheduler_start_humans = function() {
    var data = { 
        on: $("#humans-on-time").val(), 
        off: $("#humans-off-time").val(),
        init: $("#humans-init-time").val(), 
        total: $("#humans-total-time").val(),
        amount: $("#humans-amount").val()
    };
    start_humans(data, () => {
        $("#scheduler-start-humans").removeClass("fa-circle-o").addClass("fa-check-circle-o");
        scheduler_upload_workflow_script();
    });
};

scheduler_upload_workflow_script = function() {
    var formData = new FormData();

    // HTML file input, chosen by user
    fileInput = document.getElementById('scheduler-workflow-script-file');
    formData.append("workflow", fileInput.files[0]);

    var request = new XMLHttpRequest();
    request.open("POST", "/workflows/file");
    request.onreadystatechange = function (aEvt) {
        if (request.readyState == 4) {
            if(request.status == 200) {
                $("#scheduler-upload-workflow").removeClass("fa-circle-o").addClass("fa-check-circle-o");
                $("#scheduler-wait-for-finished").removeClass("fa-circle-o").addClass("fa-circle-o-notch fa-spin fa-fw");
                scheduler_wait_finished();
            } else {
                console.log("Error uploading script: " + aEvt.target.responseText);
            }
        }
    };
    request.send(formData);
};

// Might take a while...
scheduler_wait_finished = function() {
    $.get('/human/info', function(data) {
        total_moment = moment(data.startTime + data.totalTime);
        if(total_moment.isBefore()) {
            $("#scheduler-wait-for-finished").removeClass("fa-circle-o-notch fa-spin fa-fw").addClass("fa-check-circle-o");
            reset_workers(() => {
                $("#scheduler-reset-workers-2").removeClass("fa-circle-o").addClass("fa-check-circle-o");
                scheduler_delete_all_workflows();                
            });
        } else {
            setTimeout(scheduler_wait_finished, 10000); // Could calculate how long it still takes...!
        }
    });
};

scheduler_delete_all_workflows = function() {
    delete_all_workflows(() => {
        $("#scheduler-delete-workflows").removeClass("fa-circle-o").addClass("fa-check-circle-o");
        
        scheduler_update_policy("Off");
        $("#scheduler-set-policy-off").removeClass("fa-circle-o").addClass("fa-check-circle-o");
    });
};

scheduler_update_policy = function(policy) {
    $.post("/scheduler/policy/" + policy, (data) => {
        console.log("Updated policy to: " + data.policy);
        update_scheduler_info();
    }).fail(() => {
        console.log("Unable to update policy");
    });
};

scheduler_set_amount = function(policy, amount) {
    $.post("/scheduler/amount/" + policy + "/" + amount, (data) => {
        console.log("Updated "+policy+" amount to: " + data.amount);
        update_scheduler_info();
    }).fail(() => {
        console.log("Unable to update "+policy+" amount");
    });
};

update_scheduler_info = function() {
    $.get("/scheduler/policy", (data) => {
        $("#scheduler-get-policy").val(data.policy);
    }).fail(() => {
        console.log("Unable to get policy");
    });

    $.get("/scheduler/amount", (data) => {
        $("#scheduler-get-amount-at-start").val(data.at_start);
        $("#scheduler-get-amount-on-demand").val(data.on_demand);
        $("#scheduler-get-amount-learning").val(data.learning);
    }).fail(() => {
        console.log("Unable to get amount of machines");
    });

    $.get("/scheduler/machinecount", (data) => {
        $("#scheduler-get-machines").val(data.active);
        $("#scheduler-get-machines-up").val(data.up);
        $("#scheduler-get-machines-down").val(data.down);
    }).fail(() => {
        console.log("Unable to get machine count");
    });

    $.get("/nodes", (data) => {
        var amount = data.filter((n) => n.status === "ready").length;
        $("#scheduler-get-ready-nodes").val(amount); 
    }).fail(() => {
        console.log("Unable to get node status");
    });
};