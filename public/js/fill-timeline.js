/*jshint esversion: 6 */

$(function() {
    var lastTimeLineInverted = false;
    var get_timeline_html = function(data) {
        var badge = $("<div></div>")
            .addClass("timeline-badge")
            .append($("<i></i>")
                .addClass("fa fa-check")
            );

        var title = $("<h4></h4>")
            .addClass("timeline-title")
            .html("Title here");

        var time = $("<p></p>")
            .append($("<small></small>")
                .addClass("text-muted")
                .append($("<i></i>")
                    .addClass("fa fa-clock-o")
                ).append(" " + new Date(data.time).toLocaleString())
            );
        
        var heading = $("<div></div>")
            .addClass("timeline-heading")
            .append(title)
            .append(time); 

        var body = $("<div></div>")
            .addClass("timeline-body")
            .append($("<p></p>")
                .html(data.message)
            ); 

        var panel = $("<div></div>").addClass("timeline-panel").append(heading).append(body);

        var item = $("<li></li>").append(badge).append(panel);
        if (!lastTimeLineInverted) {
            item.addClass("timeline-inverted");
        }
        lastTimeLineInverted = !lastTimeLineInverted;

        return item;
    };

    jQuery.fn.extend({
        register_event: function(data) {
            this.prepend(get_timeline_html(data));
        },
        get_events: function() {
            $.get("/event", (data) => this.register_event(data));
            setTimeout(() => this.get_events(), 20000);
        }
    });
});