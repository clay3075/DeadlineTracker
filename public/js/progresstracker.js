var socket = io();
var roomName = document.location.href.substr(document.location.href.lastIndexOf('=') + 1);
document.title = roomName + ' Tracker';
var previousCount = 0;
var archived = false;

socket.emit('newConnection', roomName);

socket.on('newConnection', function(data) {
    updateGoal(data['goal']);
    updateCurrentCount(data['currentCount']);
    updateOverallGoal(data['overallgoal']);
    previousCount = parseInt(data['previouscount']);
    updateOverallCount();
    console.log(data['workers'])
    data['workers'].forEach(function(worker) {
        addNewWorkerToList(worker.name);
        setWorkerCounter(worker.name, worker.count, data['currentCount'])
    });
    archived = data['archived'];
    if(archived) {
        alert("Room has been archived and can no longer be edited.");
        disableAllElements();
    }
});

socket.on('updateGoal', function(goal) {
    updateGoal(goal);
    updateRemaining();
});

socket.on('updateOverallGoal', function(goal) {
    updateOverallGoal(goal);
    updateRemaining();
});

socket.on('updatePreviousCount', function(count) {
    previousCount = count;
    updateOverallCount();
});

socket.on('resetRoom', function(roomID) {
    location.reload();
});

socket.on('setWorkerCounter', function(data) {
    setWorkerCounter(data['worker'], data['count'], data['currentCount']);
});

socket.on('newWorker', function (worker) {
    addNewWorkerToList(worker);
});

function updateRemaining() {
    $('#successMessage').hide();
    var remaining = parseInt($('#currentgoal').html())-parseInt($('#currentCount').html());
    $('#remaining').html(remaining);
    var remainingoverall = parseInt($('#currentoverallgoal').html())-(parseInt($('#currentCount').html())+parseInt(previousCount));
    $('#remainingoverall').html(remainingoverall);
    if (remaining == 0)
        showSuccessMessage("The goal has been reached for today!!");
    if (remaining < 0)
        showSuccessMessage("The goal has been surpassed by <b>" + (-1 * remaining) + "</b> for today!");
    if (remainingoverall <= 0) {
        showSuccessMessage("Congratulations your goal has been reached!!");
        disableCounterButtons();
        disableAddWorkerGroup();

    } else {
        enableCounterButtons();
        enableAddWorkerGroup();
    }
}

function enableCounterButtons() {
    toggleCounterButtonsTo(false);
}

function disableCounterButtons() {
    toggleCounterButtonsTo(true);
}

function toggleCounterButtonsTo(flag) {
    toggleElements($('*[class*=counterbtn]'), flag);
}

function enableAddWorkerGroup() {
    toggleAddWorkerGroup(false);
}

function disableAddWorkerGroup() {
    toggleAddWorkerGroup(true);
}

function toggleAddWorkerGroup(flag) {
    toggleElements($('#addWorkerGroup').find('*'), flag);
}

function toggleElements(elements, flag) {
    elements.each(function() {
        toggleElement(this, flag);
    });
}

function toggleElement(element, flag) {
    $(element).attr("disabled", flag);
}

function updateCurrentCount(count) {
    $('#currentCount').html(count);
    updateOverallCount();
}

function updateOverallCount() {
    var count = parseInt($('#currentCount').html()) + parseInt(previousCount);
    $('#currentOverallCount').html(count);
    updateRemaining();
}

function updateGoal(goal) {
    $('#currentgoal').html(goal);
}

function updateOverallGoal(goal) {
    $('#currentoverallgoal').html(goal);
}

function setGoal() {
    socket.emit("updateGoal", {'roomID':roomName, 'goal':$("#goalInput").val()});
    $("#goalInput").val("");
}

function setOverallGoal() {
    socket.emit("updateOverallGoal", {'roomID':roomName, 'overallgoal':$("#overallGoalInput").val()});
    $("#overallGoalInput").val("");
}

function setPreviousCount() {
    socket.emit("updatePreviousCount", {'roomID':roomName, 'previouscount':$("#previousCount").val()});
    $("#previousCount").val("");
}

function plusButtonClicked(worker) {
    socket.emit('addOne', {'roomID':roomName, 'worker':worker});
}

function minusButtonClicked(worker) {
    socket.emit('minusOne', {'roomID':roomName, 'worker':worker});
}

function setWorkerCounter(worker, count, currentCount) {
    $('#'+worker+'Counter').html(count);
    updateCurrentCount(currentCount);
}

function addNewWorkerToList(worker) {
    var minusButton = "<td><button class=\"btn counterbtn\" onclick='minusButtonClicked(\"" + worker + "\")'>-</button></td>";
    var counterInput = "<td style=\"text-align:center;\"><span id='" + worker + "Counter'>0</span></td>";
    var plusButton = "<td><button class=\"btn counterbtn\" onclick='plusButtonClicked(\"" + worker + "\")'>+</button></td>";
    var html = "<tr><td>" + worker + " </td>" + minusButton + counterInput + plusButton + "</tr>"

    $('#counters').append(html);
}


function addWorker() {
    socket.emit('newWorker', {'roomID':roomName, 'worker':$("#newWorker").val()});
    $("#newWorker").val("");
}

function showSuccessMessage(message) {
    $('#successMessage').html(message);
    $('#successMessage').show();
}

function Reset() {
    if (confirm("Are you sure you know what you are doing?")) {
        console.log("puff")
        socket.emit("reset", roomName);
    } 
}

function slowToggle() {
    root = $('#workerTable');
    var up = "<i class=\"fa fa-chevron-up\"></i></button>";
    var down = "<i class=\"fa fa-chevron-down\"></i></button>";
    $('#workerToggle').html($('#workerToggle').html().includes('up') ? down : up);
    root.find('tbody tr').each(function(i, tr) {
        setTimeout(function() {
            $(tr).toggle();
        }, i*50)
    });
}

function disableAllElements() {
    toggleElements($(document.body).find("*"), true);
}