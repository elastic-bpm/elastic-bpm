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
        
        $("#scheduler-ondemand-execution").on('click', function(event) {
            scheduler_start_execution('OnDemand');
        });
        
        $("#scheduler-learning-execution").on('click', function(event) {
            scheduler_start_execution('Learning');
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
    $.delete('/scheduler/execution', function(data) {
        update_scheduler_info();
    });
};

scheduler_start_execution = function(policy) {
    var amount = 0;
    if (policy === "AtStart") {
        amount = $("#scheduler-get-amount-at-start").val();
    }
    if (policy === "OnDemand") {
        amount = $("#scheduler-get-amount-on-demand").val();
    }
    if (policy === "Learning") {
        amount = $("#scheduler-get-amount-learning").val();
    }

    var formData = new FormData();

    // HTML file input, chosen by user
    fileInput = document.getElementById('scheduler-workflow-script-file');
    formData.append("workflow", fileInput.files[0]);

    var request = new XMLHttpRequest();
    request.open("POST", "/scheduler/execution/"+ policy +"/" + amount);
    request.onreadystatechange = function (aEvt) {
        if (request.readyState == 4) {
            if(request.status == 200) {
                console.log("Started execution!");
                update_scheduler_info();
            } else {
                console.log("Error uploading script: " + aEvt.target.responseText);
            }
        }
    };
    request.send(formData);
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

    $.get("/scheduler/execution", (data) => {
        Object.keys(data).forEach(function(key, index) {
            if (this[key] === "done") {
                $("#"+key).removeClass("fa-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-check-circle-o")
            } else if (this[key] === "busy") {
                $("#"+key).removeClass("fa-check-circle-o fa-circle-o").addClass("fa-circle-o-notch fa-spin fa-fw")
            } else {
                $("#"+key).removeClass("fa-check-circle-o fa-circle-o-notch fa-spin fa-fw").addClass("fa-circle-o")
            }
        }, data);
    });
};