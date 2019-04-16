var express = require('express')
var app = express()
var http = require('http').Server(app);
var io = require('socket.io')(http);
var dateFormat = require('dateformat');
var path = require('path')
const fs = require('fs');

var rooms = {}
// var goal = 0;
// var currentCount = 0;
// var workers = {}

app.use('/static', express.static(path.join(__dirname, '/public')))
app.get('/:roomName', function (req, res) {
	console.log(req.params.roomName)
   res.redirect('static/index.html?roomID='+req.params.roomName);
})

http.listen(3000, function () {
   console.log('Example app listening on port 3000!')
})

io.sockets.on('connection', function (socket) {
  socket.on('newConnection', function(roomID) {
  	socket.join(roomID);
  	console.log('new connection');
    console.log('rooms:' + rooms);
    if (!rooms.hasOwnProperty(roomID)) {
      rooms[roomID] = {};
      rooms[roomID]['goal'] = 0;
      rooms[roomID]['currentCount'] = 0;
      rooms[roomID]['workers'] = {}
    }
  	
  	socket.emit('newConnection', {'currentCount':rooms[roomID]['currentCount'], 'goal':rooms[roomID]['goal'], 'workers':rooms[roomID]['workers']});
  });

  socket.on('updateGoal', function (data) {
    console.log(data);
    roomID = data['roomID'];
    goal = data['goal'];
    io.in(roomID).emit("updateGoal", goal);
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
  	rooms[room]['workers'][worker]++;
  	currentCount++;
  	saveProgress();
  	io.in(roomID).emit('setWorkerCounter', {'worker': worker, 'count': rooms[room]['workers'][worker], 'currentCount':rooms[room]['currentCount']});
  });
  socket.on('minusOne', function(data) {
    var worker = data['worker'];
    var roomID = data['roomID'];
  	if(workers[worker] > 0) {
  		currentCount--;
  		rooms[room]['workers'][worker]--;
  		saveProgress();
  		io.in(roomID).emit('setWorkerCounter', {'worker': worker, 'count': rooms[room]['workers'][worker], 'currentCount':rooms[room]['currentCount']});
  	}
  })
});

function saveProgress() {
  for(room in rooms) {
    var progress = "Goal: " + rooms[room]['goal'] + "\n";
    progress += "CurrentCount: " + rooms[room]['currentCount'] + "\n";
    progress += "Remaining: " + rooms[room]['goal'] - rooms[room]['currentCount'] + "\n";
    for(worker in rooms[room]['workers']) {
      progress += worker + ": " + rooms[room]['workers'][worker] + "\n";
    }
    fs.writeFile(__dirname + "\\deadlineProgress"+room+dateFormat(new Date(), "yyyymmddhMMss")+".txt", progress, function(err) {
      if(err) {
          return console.log(err);
      }

      console.log("progress saved!");
    }); 
  }
}
