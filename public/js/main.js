var global_status_data = [];

$( document ).ready(function() {
    interval = 5000; // higher interval for less hang ups?
    socket = io();

    var hash = window.location.hash;
    hash && $('ul.nav a[href="' + hash + '"]').tab('show');

    $('.nav a').click(function (e) {
        $(this).tab('show');
        var scrollmem = $('body').scrollTop() || $('html').scrollTop();
        window.location.hash = this.hash;
        $('html,body').scrollTop(scrollmem);
    });

    timeline_init(socket, interval);
    console_init(socket, interval);
    dashboard_init(socket, interval);
    workflows_init(socket, 2*interval);
    machines_init(socket, interval);
    nodes_init(socket, interval);
    containers_init(socket, interval);
    workers_init(socket, interval);
    humans_init(socket, 2*interval);
    scheduler_init(socket, interval);
});