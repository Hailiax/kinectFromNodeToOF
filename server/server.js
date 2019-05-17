const express = require('express');
const app = express();

const http = require('http').Server(app);

const io = require('socket.io')(http);
const port = process.env.PORT || 3000;


http.listen(port, () => console.log('listening on port ' + port));

let kinectData = [];

io.on('connection', function(socket){

	console.log(socket.id + "connected");

	function broadcastData(){
		if(socket.connected){

			//console.log(kinectData.length);
			if(kinectData.x != null){
				socket.emit('kinectData', kinectData);

				console.log('sending: x - ' + kinectData.x);

				//kinectData = [];
			}

			setTimeout(broadcastData, 50);
		}
	}

	//broadcastData();

	socket.on('message', function(data){
		kinectData = data;

		console.log("received: " + kinectData.x);

		broadcastData();
	});
});

io.on('disconnect', function(socket){
	console.log(socket.id + "disconnected");
});