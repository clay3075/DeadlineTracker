var express = require('express')
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var path = require('path')
const fs = require('fs');
var mongoose = require('mongoose');
var Room = require('./models/room');
var Worker = require('./models/worker');
const config = require("./config");

var rooms = {}
const HOME_ROOM_ID = "1ed05933-48ee-49ab-9807-2783147623f9"

mongoose.connect(config.DB_ConnectionString, { useNewUrlParser: true }); // connect to our database

// Room.collection.drop();
// Worker.collection.drop();

app.use('/static', express.static(path.join(__dirname, '/public')))

app.get('/', function (req, res) {
   res.redirect('/static/index.html');
});

app.get('/room/:roomName', function (req, res) {
	console.log(req.params.roomName)
   res.redirect('/static/progresstracker.html?roomID='+req.params.roomName);
})

http.listen(3001, function () {
   console.log('Listening on port 3001!')
});

io.sockets.on('connection', function (socket) {
  socket.on('newConnection', function(roomID) {
  	socket.join(roomID);
  	console.log('new connection');
    Room.findOne( { 'name': roomID }, function(err, room) {
    	if (room == null) {
	      room = Room()
	      room.name = roomID;
	      room.save();
	      io.in(HOME_ROOM_ID).emit('addRoom', roomID);
	    }

	  	room.workers.find(function(err, workers) {
	  		socket.emit('newConnection', {'currentCount':room.currentCount, 'goal':room.goal, 'workers':workers, 'previouscount':room.previousCount, 'overallgoal':room.overallGoal, 'archived':room.archived});
	  	});
    });
  });

  socket.on('reset', function(roomID) {
    resetRoom(roomID);
    io.in(roomID).emit('resetRoom', roomID);
    var tmpRoom = getCurrentProgress(roomID);
	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
  });
  socket.on('updateGoal', function (data) {
    console.log(data);

    roomID = data['roomID'];
    Room.findOne( { 'name': roomID }, function(err, room) {
    	room.goal = data['goal'];
    	room.save();
	    io.in(roomID).emit("updateGoal", room.goal);
	    var tmpRoom = getCurrentProgress(room);
	  	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
    });
    
  });
  socket.on('updateOverallGoal', function(data) {
    console.log(data);
    roomID = data['roomID'];
    Room.findOne( { 'name': roomID }, function(err, room) {
    	room.overallGoal = data['overallgoal'];
	    room.save();
	    io.in(roomID).emit("updateOverallGoal", room.overallGoal);
	    var tmpRoom = getCurrentProgress(room);
		io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
    });
  });
  socket.on('updatePreviousCount', function(data) {
    console.log(data);
    roomID = data['roomID'];
    Room.findOne( { 'name': roomID }, function(err, room) {
    	room.previousCount = data['previouscount'];
	    room.save();
	    io.in(roomID).emit("updatePreviousCount", room.overallGoal);
	    var tmpRoom = getCurrentProgress(room);
		io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
    });
  });
  socket.on('newWorker', function (data) {
  	console.log('newWorker')
  	console.log(data);

    var worker = Worker()
    worker.name = data['worker'];
    worker.roomID = data['roomID'];
  	worker.save();
    io.in(worker.roomID).emit("newWorker", worker.name);
  });
  socket.on('addOne', function(data) {
    var workerName = data['worker'];
    var roomID = data['roomID'];
    Worker.findOne( { 'name': workerName, 'roomID': roomID }, function(err, worker) { 
    	console.log(worker.room)
    	Room.findOne( { 'name': roomID }, function(err, workerRoom) {
    		worker.incrementWorkCount();
		    workerRoom.incrementCurrentCount(); 
		    worker.save();
		    workerRoom.save();
		  	io.in(roomID).emit('setWorkerCounter', {'worker': worker.name, 'count': worker.count, 'currentCount':workerRoom.currentCount});
		  	var tmpRoom = getCurrentProgress(workerRoom);
		  	io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
    	});
    });
  });
  socket.on('minusOne', function(data) {
    var workerName = data['worker'];
    var roomID = data['roomID'];
    Worker.findOne( { 'name': workerName, 'roomID': roomID }, function(err, worker) {
    	Room.findOne( { 'name': roomID }, function(err, workerRoom) {
    		if(worker.count > 0) {
		      worker.decrementWorkCount();
		      workerRoom.decrementCurrentCount();
		      worker.save();
		      workerRoom.save();
		  	  io.in(roomID).emit('setWorkerCounter', {'worker': worker.name, 'count': worker.count, 'currentCount':workerRoom.currentCount});
		      var tmpRoom = getCurrentProgress(data['roomID']);
		      io.in(HOME_ROOM_ID).emit('updateRoomProgress', tmpRoom);
		  	}
    	});
    });
  });
  socket.on('loadRooms', function(data) {
  	socket.join(HOME_ROOM_ID);
  	Room.find( {'archived': false}, function(err, rooms) {
  		var activeRooms = rooms.map( room => getCurrentProgress(room) )
  		socket.emit('loadRooms', activeRooms);
  	});
  });
  socket.on('loadArchivedRooms', function(data) {
    Room.find( {'archived': true}, function(err, rooms) {
    	var archivedRooms = rooms.map( room => getCurrentProgress(room) )
  		socket.emit('loadArchivedRooms', archivedRooms);
    });
  });
  socket.on('closeRoom', function(roomID) {
  	Room.findOne( { 'name': roomID }, function(err, room) {
  		room.archived = true;
	    room.save();
	  	io.in(HOME_ROOM_ID).emit('closeRoom', roomID);
	  	io.in(roomID).emit('resetRoom', null);
  	});
  });
});

function getCurrentProgress(room) {
	var tmpRoom = {
		'room': room.name,
		'progress': room.currentCount,
		'progressOverall': parseInt(room.currentCount) + parseInt(room.previousCount),
		'goal': room.goal,
		'goalOverall': room.overallGoal
	};
	return tmpRoom;
}

function resetRoom(roomID) {
  Room.findOne( { 'name': roomID }, function(err, room) {
  	room.workers.find(function(err, workers) { 
  	workers.forEach( function(worker) {
	    worker.count = 0;
	    worker.save();
	})
  });
  room.goal = 0;
  room.previousCount += room.currentCount;
  room.currentCount = 0;
  room.save();
  });
}

