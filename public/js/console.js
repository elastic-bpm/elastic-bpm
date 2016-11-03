/*jshint esversion: 6 */

console_init = function(socket) {
    $.get("/parts/console.html", (data) => {
        $("#console").html(data);
        $("#console-output").prepend("This is off!");
        // socket.on('event', (event) => { 
        //     $("#console-output").prepend(event.time + ":" + event.message + "\n");
        // });
    });
};