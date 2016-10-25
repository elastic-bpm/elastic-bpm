/*jshint esversion: 6 */

select_task = function(tasks, callback) {
    callback(tasks[Math.floor(Math.random()*tasks.length)]);
};

exports.select_task = select_task;