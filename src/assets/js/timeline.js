/*jshint esversion: 6 */

timeline_init = function(socket, interval) {
    $.get("/parts/timeline.html", (data) => {
        $("#timeline").html(data);
        $("#timeline-list").register_events(socket);
    });
};

var lastTimeLineInverted = false;
jQuery.fn.extend({
    register_events: function(socket) {
        socket.on('event', (event) => {
            if (event.title === "publish") { 
                if (!lastTimeLineInverted) {
                    event.inverted = "timeline-inverted";
                }
                lastTimeLineInverted = !lastTimeLineInverted;

                this.loadTemplate("templates/timeline-template.html", event, { prepend: true});
            }
        });
    }
});