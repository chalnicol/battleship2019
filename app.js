//app.js

var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var express = require('express');
var app = express();
var serv = require('http').Server(app);
var io = require('socket.io')(serv,{});

app.get('/',function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

//serv.listen(2000);
serv.listen(process.env.PORT || 2000);

console.log("Server started.");

var socketList = {};
var playerList = {};
var roomList = {};

var playerCount = 0;
var updateCount = 0; 

//Player..
Player = function (id, username){
	
	var plyr  = {
		
		id:id,
		username:username,
		roomid : '',
		strikeCount : 0,
		winCount : 0,
		isReady:false,
		isInsideRoom : false,
		isReadyForRematch : false,
		grid : [],
		fleet  : []
	
	}

	plyr.score = function () {
		plyr.gamePoints += 1;
	}

	plyr.resetData = function () {

		plyr.isReady = false;
		plyr.isReadyForRematch = false;
		plyr.grid = [];
		plyr.fleet = [];
	}

	return plyr;

}

//Rooms..
GameRoom = function ( id, isTimed=false ) {
	
	var rm = {

		id : id,
		prepTime : 15,
		blitzTime : 10,
		turn : 0,
		counter : 0,
		isWinner : '',
		playerIDs : [],
		playerCount : 0,
		clickedPost : -1,
		isClosed : false,
		isHit : false,
		isTimed : isTimed,
		isGameOn : false,
		timer : null

	}


	rm.stopTimer = function () {
		
		clearInterval( rm.timer );

		rm.counter = 0;
	}
	
	rm.startTimer = function ( max ) {
		//..
		clearInterval ( rm.timer );
		rm.timer = setInterval ( function () {
			rm.counter += 1;
			//console.log ( rm.counter );
			if ( rm.counter >= max) {
				rm.stopTimer();
			}

		}, 1000 );
		
	}

	rm.initGame  = function () {
		//..
		rm.isClosed = true;

		if ( rm.isTimed ) rm.startTimer( rm.prepTime );
	}

	rm.startGame  = function () {
		//..
		rm.isGameOn = true;

		if ( rm.isTimed ) rm.startTimer( rm.blitzTime);
	}

	rm.endGame = function () {
		
		rm.isGameOn = false;

		rm.stopTimer ();

	}

	rm.resetGame = function () {
		//..
		rm.turn = rm.turn == 0 ? 1 : 0;
		rm.clickedPost = -1;
		rm.isHit = false;
		rm.counter = 0;

	}

	rm.switchTurn = function () {

		rm.turn = rm.turn == 0 ? 1 : 0;
		
		rm.resetTurn ();

	}

	rm.resetTurn = function () {
		
		if ( rm.isTimed ) {
			rm.stopTimer();
			rm.startTimer ( rm.blitzTime );
		}
	}
	return rm;
	
}

io.on('connection', function(socket){
	
	socketList[socket.id] = socket;
	
	socket.on("initUser", function (data) {
		
		var newPlayer = Player ( socket.id, data );

		playerList [ socket.id ] = newPlayer;

		console.log ( '\n --> ' + newPlayer.username  + ' has entered the game.' );

		sendPlayersOnline ();
		
	});

	socket.on ('getPlayersOnline', function (data) {
		
		var playersCount = Object.keys(socketList).length;

		socket.emit ( 'playersOnline', playersCount );
		
	});
	
	socket.on("enterGame", function (data) {
	
		//console.log ( data );

		if ( data.isSinglePlayer ) {

			var newRoom = GameRoom ( socket.id, data.isTimed );
				
			newRoom.playerIDs.push ( socket.id )

			roomList [ socket.id ] = newRoom;

			var player = playerList [ socket.id ];

			player.roomid = socket.id;

			var returnData = {
			
				'isSinglePlayer' : true,
				'players' : {
					'self' : player.username,
				}
	
			};

			socket.emit ('initGame', returnData );


		}else {
	
			var availableRoom = getAvailableRoom();

			console.log ('\n --> avail room',  availableRoom );

			if ( availableRoom == null ) {

				var newRoom = GameRoom ( socket.id, data.isTimed );
				
				newRoom.playerIDs.push ( socket.id );

				newRoom.playerCount += 1;

				roomList [ socket.id ] = newRoom;

				var player = playerList [ socket.id ];

				player.roomid = socket.id;

				socket.emit ('waitingGame', null );

				console.log ( '\n --> Room Created :', newRoom.id );

			}else  {
				
				var player = playerList [ socket.id ];

				player.roomid = availableRoom;

				var gameRoom = roomList [ availableRoom ];

				gameRoom.playerIDs.push ( socket.id );

				gameRoom.playerCount += 1;

				gameRoom.initGame ();

				//initialize game..
				initGame ( gameRoom.playerIDs );
		
			}

		}

			
	});

	socket.on("playerReady", function (data) {
		
		var player = playerList [socket.id];
		
		initGridData ( socket.id, data );

		//console.log ( '\n ...  data sent by ' + player.username );
		
		var checker = checkPlayersAreReady ( player.roomid );

		if ( checker ) {
			
			startGame ( player.roomid );

		}else {

			sendPlayerReady ( player.roomid );
		}
		
	});
	
	socket.on("gridClicked", function ( data ) {
		//..
	
		if ( verifyClickSent(socket.id ) ) {

			console.log ('\n --> Click received from ' + playerList[socket.id].username + ':', data );

			analyzeGridClicked ( data, socket.id );

		}else {

			console.log ('\n --> Click received is invalid');

		}
		

	});

	socket.on("rematchRequest", function (data) {
		
		var plyr = playerList [ socket.id ]
		
		plyr.isReadyForRematch = true;
		
		if ( bothPlayersRequestsRematch ( plyr.roomid ) ) {

			resetGame ( plyr.roomid );
		}

	});
	
	socket.on("leaveGame", function(data) {
		
		var plyr = playerList[socket.id];
		
		console.log ( '\n <-- ' + plyr.username +' has left the game', plyr.roomid == '' ? 'singlePlayer' : plyr.roomid );

		leaveRoom ( socket.id, plyr.roomid );

	});
	
	socket.on("disconnect",function () {
			
		if ( playerList.hasOwnProperty(socket.id) ) {
			
			var plyr = playerList[socket.id];
			
			if ( plyr.roomid != '' ) leaveRoom ( socket.id, plyr.roomid );
			
			console.log ( '\n <-- ' + plyr.username  + ' has been disconnected.' );

			delete playerList [socket.id];

		}

		delete socketList [socket.id];

		sendPlayersOnline();

		
	});

	

});


function getAvailableRoom () {

	for ( var i in roomList ) {
		if ( !roomList[i].isClosed ) return roomList[i].id;
	}
	return null;

}
function verifyClickSent ( socketid ) {

	var player = playerList [socketid];

	var gameRoom = roomList [ player.roomid ];

	if ( gameRoom.playerIDs.indexOf (socketid) != gameRoom.turn ) return false;

	return true;
}
function initGame ( playerIDs ) {

	for ( var i = 0; i < playerIDs.length; i++ ) {

		var counter = i == 0 ? 1 : 0;

		var self = playerList [ playerIDs[i] ];

		var oppo =  playerList [playerIDs[counter]];

		var data = {
			
			'isSinglePlayer' : false,
			'players' : {
				'self' : self.username,
				'oppo' : oppo.username
			}

		};

		var socket = socketList [ playerIDs[i] ];

		socket.emit ('initGame', data );

	}

}
function checkPlayersAreReady ( roomID ) {

	var gameRoom = roomList [roomID];

	for ( var i = 0; i < gameRoom.playerCount; i++ ) {

		var player = playerList [  gameRoom.playerIDs[i] ];

		if ( !player.isReady ) return false;
	}

	return true;

}
function bothPlayersRequestsRematch ( roomID ) {

	var gameRoom = roomList [roomID];

	for ( var i = 0; i < gameRoom.playerCount; i++ ) {

		var player = playerList [ gameRoom.playerIDs[i] ];

		if ( !player.isReadyForRematch ) return false;
	}

	return true;

}
function sendPlayerReady ( roomID ) {

	var gameRoom = roomList[roomID];

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var self = playerList [ gameRoom.playerIDs[i] ];

		var oppo  = playerList [ gameRoom.playerIDs[ i==0 ? 1 : 0] ];

		var returnData = {
			'self' : self.isReady,
			'oppo' : oppo.isReady
		}

		var socket = socketList [ self.id ];

		socket.emit ('onePlayerReady', returnData );
	}

}
function sendPlayersOnline () {
	
	var playersCount = Object.keys(socketList).length;

	for ( var i in socketList ) {
		
		var socket = socketList [i]; 

		socket.emit ( 'playersOnline', playersCount );

	}
}
function startGame ( roomID ) {

	console.log ( '\n Game has started...', roomID );

	var gameRoom = roomList[roomID];

	gameRoom.startGame();

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var turn  = ( i == gameRoom.turn ) ? 'self' : 'oppo';

		var socket = socketList [ gameRoom.playerIDs[i] ];

		socket.emit ('startGame', turn );
	}

} 
function resetGame ( roomID ) {

	console.log ( '\n Game has been restarted...', roomID );

	var gameRoom = roomList[roomID];

	gameRoom.resetGame();

	for ( var i=0; i<gameRoom.playerCount; i++) {

		var player = playerList [ gameRoom.playerIDs[i] ];

		player.resetData ();
		
		var socket = socketList [ gameRoom.playerIDs[i] ];

		socket.emit ('resetGame', null );
	}

} 
function leaveRoom ( playerid, roomid ) {
	
	var player = playerList [playerid];

	player.roomid = '';

	player.resetData ();

	if ( roomList.hasOwnProperty( roomid ) ) {
		
		var gameRoom = roomList [roomid];
		
		var index = gameRoom.playerIDs.indexOf ( playerid );
		
		gameRoom.playerIDs.splice ( index, 1);

		gameRoom.playerCount += -1;

		if ( gameRoom.playerCount > 0 ) {
			
			if ( gameRoom.isGameOn ) gameRoom.endGame ();

			var socket = socketList [ gameRoom.playerIDs[0] ];
			
			socket.emit ('opponentLeft', {} );
			
			console.log ( '\n <-- Opponent Left :', roomid  );

		} else {
			//...
			delete roomList [roomid];

			console.log ( '\n <-- Room deleted :', roomid  );

		}

		//console.log ('\n <-- ' + player.username + ' has left the game room.' );

	}
	
}
function initGridData ( playerid, fleet ) {

	var player = playerList [ playerid ];
		
	player.isReady = true;

	player.fleet = fleet;

	player.grid = [];

	//initialize grid data..

	for ( var z=0; z<100; z++) {

		player.grid.push ( {
			'isResided' : false,
			'isTrashed' : false,
			'index' :  -1
		});

	}	

	//update grid data base on fleet data sent..

	for ( var i=0; i<fleet.length; i++ ) {
		
		var rotation = fleet[i].rotation;

		var len = fleet[i].length;

		var index = fleet[i].index;

		var post = fleet[i].post;


		for ( var j=0;j<len;j++) {

			player.grid [post].isResided = true;

			player.grid [post].index = i;

			if ( rotation == 0 ) {
				post++;
			}else {
				post += 10;
			}

		}

	}
	
	//...

	
}
function analyzeGridClicked ( post, playerid ) {
	
	var isWinner = false;

	var shipIndex = -1;

	var shipSunk = null;

	var plyr = playerList[playerid];

	var opponent = playerList [ getOpponentsId ( playerid ) ];

	var room = roomList[plyr.roomid];

	var isHit = ( opponent.grid[post].isResided ) ? true : false;

	opponent.grid[post].isTrashed = true;

	room.clickedPost = post;

	room.isHit = isHit;
	
	if ( isHit ) {

		shipIndex = opponent.grid[post].index;

		opponent.fleet[shipIndex].remains += -1;

		if ( opponent.fleet[shipIndex].remains == 0 ) {

			shipSunk = {
				'post' : opponent.fleet[shipIndex].post,
				'length' : opponent.fleet[shipIndex].length,
				'rotation' : opponent.fleet[shipIndex].rotation,
				'index' : shipIndex
			};

		}

		isWinner = checkWinner ( opponent.id );

		if ( isWinner ) {
			
			plyr.winCount +=1;

			room.endGame ();

		}else {

			room.resetTurn ();
		}

	}else {

		room.switchTurn();

	}

	for ( var i = 0; i < room.playerCount; i++) {
		
		//var against = room.playerIDs[i] != playerid ? 'self' : 'oppo';

		var self = playerList [ room.playerIDs[i] ];

		var oppo = playerList [ room.playerIDs[ i == 0 ? 1 : 0 ] ];

		var selfGrid = [], oppoGrid = [];

		for ( var j = 0; j < 100; j++ ) {
			
			selfGrid.push ( { 
				'isTrashed' : self.grid[j].isTrashed, 
				'isResided' : (self.grid[j].isTrashed) ? self.grid[j].isResided : false,
			});

			oppoGrid.push ( { 
				'isTrashed' : oppo.grid[j].isTrashed, 
				'isResided' : (oppo.grid[j].isTrashed) ? oppo.grid[j].isResided : false,
			});

		}

		var selfFleet = [], oppoFleet = [];

		for ( var k = 0; k < 6; k++ ) {

			selfFleet.push ({ 
				'remains' : self.fleet[k].remains, 
			});
			oppoFleet.push ({ 
				'remains' : (oppo.fleet[k].remains > 0) ? oppo.fleet[k].length : 0, 
			});

		}

		var returnData = {
			
			'isHit' : isHit,
			'isWinner' : isWinner,
			'post' : post,
			'shipIndex' : shipIndex, 
			'shipSunk' : shipSunk,
			'self' : {
				'grid' : selfGrid,
				'fleet' : selfFleet,
			},
			'oppo': {
				'grid' : oppoGrid,
				'fleet' : oppoFleet,
			}

		}

		//console.log ( ' --> Data sent to ', self.username );
		
		var socket = socketList [ self.id ];

		socket.emit ( 'gridClickResult',  returnData );
	}

	
}
function getOpponentsId ( playerid ) {
	
	var plyr = playerList[playerid];
	
	if ( plyr.roomid != '' ) {
		
		var index = roomList[ plyr.roomid ].playerIDs.indexOf( playerid );
		
		var oppIndex = ( index == 0 ) ? 1 : 0;
		
		return roomList[ plyr.roomid ].playerIDs[oppIndex];
	}

	return '';

}
function checkWinner ( playerid ) {

	var fleet = playerList[playerid].fleet;

	for ( var i=0; i<fleet.length; i++) {
		if ( fleet[i].remains > 0 ) return false;
	}

	return true;
}
//............

