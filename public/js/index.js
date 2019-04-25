var socket = io();

socket.emit('loadRooms', null);

socket.on('loadRooms', function(data) {
    data.forEach(function(x) {
        addRoom(x['room'], x['progress'], x['goal'], x['progressOverall'], x['goalOverall'], x['archived']);
    });
});

socket.on('updateRoomProgress', function(data) {
    var room = data['room'];
    var progress = data['progress'];
    var progressOverall = data['progressOverall'];
    var goalOverall = data['goalOverall'];
    var goal = data['goal'];
    $(`#${room} td:nth-child(2)`).html(generateProgressBar(progress, goal));
    $(`#${room} td:nth-child(3)`).html(generateProgressBar(progressOverall, goalOverall));
});

socket.on('addRoom', function(room) {
    addRoom(room);
});

socket.on('openRoom', function(room) {
    $(`#${room}`).remove();
    addRoom(room);
});

socket.on('closeRoom', function(room) {
    $(`#${room}`).remove();
});

function addRoom(room, progress = 0, goal = 0, progessOverall = 0, goalOverall = 0, archived = false) {
    var progressBarOverall = "<td class=\"clickable\" style=\"text-align:center;\">" + generateProgressBar(progessOverall, goalOverall) + "</td>";
    var progressBarToday = "<td class=\"clickable\" style=\"text-align:center;\">" + generateProgressBar(progress, goal) + "</td>";
    var archiveButton = `<td><button class="btn btn-danger btn-sm" onclick="archiveRoom('${room}')">Archive</button></td>`;
    if (archived)
        archiveButton = `<td><button class="btn btn-success btn-sm" onclick="openRoom('${room}')">Re-Open</button></td>`;
    var html = "<tr id=\"" + room + "\"><td class=\"clickable\">" + room + " </td>" + progressBarToday + progressBarOverall + archiveButton + "</tr>"

    $('#rooms').append(html);
    $(`#${room} .clickable`).click(function() { window.open(`http://${window.location.hostname}:${window.location.port}/room/${room}`); });
}

function generateProgressBar(progress, goal) {
    var percentRemaining = progress > 0 && goal > 0 ? (progress/goal)*100 : 0;
    percentRemaining = percentRemaining.toFixed(2);
    var progressBar = `<div class=\"progress\"><div class=\"progress-bar\" role=\"progressbar\" style=\"width: ${percentRemaining}%;\" aria-valuenow=\"${progress}\" aria-valuemin=\"0\" aria-valuemax=\"${goal}\">${percentRemaining}%</div></div>`;
    return progressBar
}

function createRoom() {
    var roomName = $('#roomName').val();
    socket.emit('approveRoomName', roomName, function(response) {
        if (response.approved) {
            $('#roomName').val('');
            $('#roomNameValidation').hide();
            $('#createRoomModal').modal('hide');
            window.open(`http://${window.location.hostname}:${window.location.port}/room/${roomName}`);
        } else {
            $('#roomNameValidation').html('Server Error: ' + response.errorMessage);
            $('#roomNameValidation').show();
        }

    });
}

function archiveRoom(room) {
    console.log(room)
    socket.emit('closeRoom', room);
}

function loadArchivedRooms() {
    socket.emit('loadArchivedRooms');
    $('#btnLoadArchivedRooms').html("Hide Archived Rooms");
    $('#btnLoadArchivedRooms').click(function() {
        location.reload();
    });
}

function openRoom(room) {
    socket.emit('openRoom', room);
}