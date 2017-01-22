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
            scheduler_set_at_start_amount($("#set-at-start-amount").val());
        });

        $("#set-on-demand-amount").slider();
        $("#set-on-demand-amount-button").on('click', function(event) {
            scheduler_set_on_demand_amount($("#set-on-demand-amount").val());
        });


        $("#set-learning-amount").slider();
        $("#set-learning-amount-button").on('click', function(event) {
            scheduler_set_learning_amount($("#set-learning-amount").val());
        });


        update_scheduler_info();
        setInterval(update_scheduler_info, interval);
        console.log("Scheduler init");
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

scheduler_set_at_start_amount = function(amount) {
    $.post("/scheduler/at_start_amount/" + amount, (data) => {
        console.log("Updated at start amount to: " + data.amount);
        update_scheduler_info();
    }).fail(() => {
        console.log("Unable to update at start amount");
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
};