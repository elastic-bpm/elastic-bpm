/*jshint esversion: 6 */

check_workflow_availability = function() {
    global_status_data.forEach((item) => {
        if (item.name === 'elastic-api' && item.status === 200) {
            $("#utilities-workflows-info").html("");
        } else if (item.name === 'elastic-api'){
            $("#utilities-workflows-info").loadTemplate("templates/workflows-error.html");
        }
    });
    setTimeout(check_workflow_availability, 2000);
};

utilities_init = function(socket, interval) {
    $.get("/parts/utilities.html", (data) => {
        $("#utilities").html(data);

        $("#worker-amount").slider();
        $("#worker-amount").on("slide", function(slideEvt) {
            $("#worker-amount-value").text(slideEvt.value);
        });

        $("#create-test-workflow-button").on("click", function() {
            name = "Test-Workflow";
            owner = "test";
            nodes = "A, B";
            edges = "A -> B";

            post_workflow(name, owner, edges, nodes, () => {});
        });

        $("#workflow-script-button").on("click", function() {
            var formData = new FormData();

            // HTML file input, chosen by user
            fileInput = document.getElementById('workflow-script-file');
            formData.append("workflow", fileInput.files[0]);

            var request = new XMLHttpRequest();
            request.open("POST", "/workflows/file");
            request.send(formData);
        });

        $("#scale-workers-button").on("click", function() {
            alert("Scale the workers to" + $("#worker-amount").val());
        });

        $("#reset-workers-service-button").on("click", function() {
            alert("Reset the workers service!");
        });

        check_workflow_availability();
    });
};