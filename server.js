var express = require('express')
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var path = require('path')
const fs = require('fs');

var rooms = {}
const HOME_ROOM_ID = "1ed05933-48ee-49ab-9807-2783147623f9"

app.use('/static', express.static(path.join(__dirname, '/public')))

app.get('/', function (req, res) {
   res.redirect('/static/index.html');
});

app.get('/room/:roomName', function (req, res) {
	console.log(req.params.roomName)
   res.redirect('/static/progresstracker.html?roomID='+req.params.roomName);
})

http.listen(3000, function () {
   console.log('Example app listening on port 3000!')
})

io.sockets.on('connection', function (socket) {
  socket.on('newConnection', function(roomID) {
  	socket.join(roomID);
  	console.log('new connection');
    
    if (!rooms.hasOwnProperty(roomID)) {
      resetRoom(roomID);
      io.in(HOME_ROOM_ID).emit('addRoom', roomID);
    }
  	console.log('rooms:' + Object.keys(rooms));
  	socket.emit('newConnection', {'currentCount':rooms[roomID]['currentCount'], 'goal':rooms[roomID]['goal'], 'workers':rooms[roomID]['workers'], 'previouscount':rooms[roomID]['previouscount'], 'overallgoal':rooms[roomID]['overallgoal']});
  });

  socket.on('reset', function(room) {
    resetRoom(roomID);
    io.in(roomID).emit('resetRoom', roomID);
  });
  socket.on('updateGoal', function (data) {
    console.log(data);
    roomID = data['roomID'];
    rooms[roomID]['goal'] = data['goal'];
    io.in(roomID).emit("updateGoal", rooms[roomID]['goal']);
    var tmpRoom = {
		'room': data['roomID'],
		'progress': rooms[data['roomID']]['currentCount'],
		'goal': rooms[data['roomID']]['goal']
	};
  	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
  });
  socket.on('updateOverallGoal', function(data) {
    console.log(data);
    roomID = data['roomID'];
    rooms[roomID]['overallgoal'] = data['overallgoal'];
    io.in(roomID).emit("updateOverallGoal", rooms[roomID]['overallgoal']);
  });
  socket.on('updatePreviousCount', function(data) {
    console.log(data);
    roomID = data['roomID'];
    rooms[roomID]['previouscount'] = data['previouscount'];
    io.in(roomID).emit("updatePreviousCount", rooms[roomID]['previouscount']);
  });
  socket.on('newWorker', function (data) {
  	console.log(data);
    var worker = data['worker'];
    var roomID = data['roomID'];
  	rooms[roomID]['workers'][worker] = 0;
    io.in(roomID).emit("newWorker", worker)
  });
  socket.on('addOne', function(data) {
    var worker = data['worker'];
    var roomID = data['roomID'];
  	rooms[roomID]['workers'][worker]++;
  	rooms[roomID]['currentCount']++;
  	saveProgress(roomID);
  	io.in(roomID).emit('setWorkerCounter', {'worker': worker, 'count': rooms[roomID]['workers'][worker], 'currentCount':rooms[roomID]['currentCount']});
  	var tmpRoom = {
		'room': data['roomID'],
		'progress': rooms[data['roomID']]['currentCount'],
		'goal': rooms[data['roomID']]['goal']
	};
  	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
  });
  socket.on('minusOne', function(data) {
    var worker = data['worker'];
    var roomID = data['roomID'];
  	if(rooms[roomID]['workers'][worker] > 0) {
  		rooms[roomID]['currentCount']--;
  		rooms[roomID]['workers'][worker]--;
  		saveProgress(roomID);
  		io.in(roomID).emit('setWorkerCounter', {'worker': worker, 'count': rooms[roomID]['workers'][worker], 'currentCount':rooms[roomID]['currentCount']});
	  	var tmpRoom = {
			'room': data['roomID'],
			'progress': rooms[data['roomID']]['currentCount'],
			'goal': rooms[data['roomID']]['goal']
		};
	  	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
  	}
  });
  socket.on('loadRooms', function(data) {
  	socket.join(HOME_ROOM_ID);
  	var tmpRooms = []
  	for (key in rooms) {
  		var tmpRoom = {
  			'room': key,
  			'progress': rooms[key]['currentCount'],
  			'goal': rooms[key]['goal']
  		}
  		tmpRooms.push(tmpRoom);
  	}
  	socket.emit('loadRooms', tmpRooms);
  });
});

function resetRoom(roomID) {
  rooms[roomID] = {};
  rooms[roomID]['goal'] = 0;
  rooms[roomID]['overallgoal'] = 0;
  rooms[roomID]['previouscount'] = 0;
  rooms[roomID]['currentCount'] = 0;
  rooms[roomID]['workers'] = {};
}

function saveProgress(room) {

	var progress = "Goal: " + rooms[room]['goal'] + ";";
	progress += "OverallGoal: " + rooms[room]['overallgoal'] + ";";
	progress += "CurrentCount: " + rooms[room]['currentCount'] + ";";
	progress += "PreviousCount: " + rooms[room]['previouscount'] + ";";
	progress += "OverallCount: " + (parseInt(rooms[room]['currentCount']) + parseInt(rooms[room]['previouscount'])) + ";";
	progress += "Remaining: " + (rooms[room]['goal'] - rooms[room]['currentCount']) + ";";
	for(worker in rooms[room]['workers']) {
	  progress += worker + ": " + rooms[room]['workers'][worker] + ",";
	}
	fs.writeFile(__dirname + "\\deadlineProgress"+room+dateFormat(new Date(), "yyyymmddhMMss")+".txt", progress, function(err) {
	  if(err) {
	      return console.log(err);
	  }

	  console.log("progress saved!");
	}); 
  
}
