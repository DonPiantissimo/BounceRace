var
	gameport = process.env.PORT || 4004,
	io = require('socket.io'),
	express = require('express'),
	UUID = require('node-uuid'),
	http = require('http'),
	app = express(),
	server = http.createServer(app);

server.listen(gameport);



app.get('/', function(req,res){
res.sendFile('/index.html',{root:__dirname});
});

app.get('/*', function(req,res,next){
res.sendFile(__dirname + '/' + req.params[0]);
});

var sio = io.listen(server);


   sio.configure(function () {

    sio.set('log level', 0);

    sio.set('authorization', function (handshakeData, callback) {
        callback(null, true); // error first callback style
    });

});


game_server = require('./server.js');

sio.sockets.on('connection', function(client){
    client.userid = UUID();
    client.emit('onconnected', {id:client.userid});
    console.log('connected');
    game_server.find_game(client);
    client.on('message', function(m){
        game_server.onMessage(client,m);
    });
            client.on('disconnect', function () {

                //Useful to know when soomeone disconnects
            console.log('\t socket.io:: client disconnected ' + client.userid + ' ' + client.game_id);
            
                //If the client was in a game, set by game_server.findGame,
                //we can tell the game server to update that game state.
            if(client.game && client.game.id) {

                //player leaving a game should destroy that game
                game_server.end_game(client.game.id, client.userid);

            } //client.game_id

        });
});