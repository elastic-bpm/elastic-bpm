var load_code = function () {
    $.get( "/code", function( data ) {
        if (data == "done!") {
            $("#login").hide();
            $("#page").show();
            load_vms();
        } else {
            $( "#code" ).html( data );
            setTimeout(load_code, 2000);
        }
    });            
};

var load_vms = function () {
    $.get( "/virtualmachines", function ( data ) {
        $( "#vms" ).html("");

        var table = $('<table></table>').addClass('table').addClass('table-hover').addClass('table-mc-light-blue').addClass('table-bordered').addClass('table-condensed').attr('id', 'table');
        var head = $('<thead><tr><th>name</th><th>size</th><th>state</th></tr></thead>');
        table.append(head);
        var tbody = $('<tbody></tbody>');
        data.forEach(function(item, index) {

            var row = $('<tr><td>' + item.name + '</td><td>' + item.hardwareProfile.vmSize  + '</td><td>' + item.powerState + '</td></tr>');
            tbody.append(row);

        });
        table.append(tbody);

        $('#vms').append(table);
    });

    setTimeout(load_vms, 2000);
};

$( document ).ready(() => {
    new Clipboard('.btn');
    $("#page").hide();
    load_code();
});