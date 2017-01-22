/*jshint esversion: 6 */

var azure_sdk = (function () {
    var my = {}; // public module
    return my;
})();

exports.start_events = start_events;
exports.get_vms = get_vms;
exports.get_code = get_code;
exports.get_status = get_status;
exports.stop_vm = azure_stop_vm;
exports.start_vm = azure_start_vm;