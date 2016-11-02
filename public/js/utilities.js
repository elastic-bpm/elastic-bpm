/*jshint esversion: 6 */

utilities_init = function(socket, interval) {
    $.get("/parts/utilities.html", (data) => {
        $("#utilities").html(data);

        $("#worker-amount").slider();
        $("#worker-amount").on("slide", function(slideEvt) {
            $("#worker-amount-value").text(slideEvt.value);
        });

        $("#create-test-workflow-button").on("click", function() {
            alert("Creat-test-workflow!");
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
    });
};