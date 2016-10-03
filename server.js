var server = module.exports = {games : {}, game_count: 0},
        UUID        = require('node-uuid');

global.window = global.document = global;

require('./game.logic.js');

UUID        = require('node-uuid');

server.createGame = function(player){
    	var p_width = 400;
	var p_height = 200;
	var ball_radius = 5;
        
    	var start = {
		speed : 0.1,
		radius : ball_radius,
		self : {
			x : -p_width / 2 + 8 * ball_radius,
			y : p_height / 8,
			rotation : Math.PI/2
			},
                other : {
                        x : -p_width / 2 + 8 * ball_radius,
			y : -p_height / 8,
			rotation : Math.PI/2
			},
                
		obstacles : {},
		height : 480,
		width : 720,
		obstacle_depth : 10,
		wall_depth : 20,
		planeWidth : p_width,
		planeHeight : p_height
	};
    start.host = player;
    this.logic = new game_logic(start);
    player.send('p');
    this.draw();
};

server.draw = function (){
    setInterval(this.logic.server_physics_update.bind(this.logic),15);
};

server.onMessage = function(player, data){
    //console.log(data);
    var message = data.split('=');
    //console.log(parseFloat(message[1]));
    switch(message[0]) {
        case 'p': var ping = 3*(Date.now() - parseFloat(message[1]));
                //console.log(this.logic.players.self.ping);
                
                if (player.game.logic.server_delay<ping)
                    player.game.logic.server_delay = ping;
            break;
        case 'i':
                player.game.logic.server_handle_input(player,{angle: parseFloat(message[1]), time: parseFloat(message[2]), seq: parseInt(message[3]), apply_time : 0});
                console.log('inputs '+parseFloat(message[2]));
        break;
        
        case 's' : if (player.game.player_start){
                        player.game.logic.server_update();
                        player.game.logic.server_send_correction();
                    }
                    else
                        player.game.player_start++;
        break;
        case 'r' : if (player.game.player_start===1){
                        player.game.logic.restart_game();
                        player.game.player_start=0;
        }
            else player.game.player_start=1;
    }
    
};

server.find_game = function(player){
    if(this.game_count){
        var joined = false;
        for (var gameid in this.games){
            if(!this.games.hasOwnProperty(gameid)) continue;
            var game_instance = this.games[gameid];
            if (game_instance.player_count<2){
                console.log('joining game with id: '+gameid);
                joined = true;
                game_instance.player_client = player;
                game_instance.logic.players.other.instance = player;
                game_instance.player_count++;
                
                game_instance.player_client.game = game_instance;
                game_instance.logic.players.other.instance = player;
                game_instance.player_client.send('p=c');
                
                game_instance.logic.update_time = Date.now();
                game_instance.logic.server_update();
                game_instance.logic.server_send_correction();
                
                //game_instance.player_client.send('s');
                //game_instance.player_host.send('s');
                
                
                game_instance.active = true;
                
                //this.startGame(game_instance);
            }
        }
        
        if(!joined)
            this.create_game(player);
        
    } else
        this.create_game(player);
};

server.create_game = function(player){
    var thegame = {
        id : UUID(),
        player_host : player,
        player_client : null,
        player_count : 1,
        player_start : 0
    };
    var p_width = 400;
    var p_height = 200;
    var ball_radius = 5;

    var start = {
        speed: 0.1,
        radius: ball_radius,
        self: {
            x: -p_width / 2 + 8 * ball_radius,
            y: p_height / 8,
            rotation: Math.PI / 2
        },
        obstacles: {},
        height: 480,
        width: 720,
        obstacle_depth: 10,
        wall_depth: 20,
        planeWidth: p_width,
        planeHeight: p_height,
        game_instance : thegame
    };
    
    this.games[thegame.id] = thegame;
    this.game_count++;
    thegame.logic = new game_logic(thegame);
    player.game = thegame;
    player.hosting = true;
    player.send('p=h');
    
    
    return thegame;
};

    server.end_game = function(gameid, userid) {

        var thegame = this.games[gameid];

        if(thegame) {

                //stop the game updates immediate
            thegame.logic.stop_update();

                //if the game has two players, the one is leaving
            if(thegame.player_count > 1) {

                    //send the players the message the game is ending
                if(userid == thegame.player_host.userid) {

                        //the host left, oh snap. Lets try join another game
                    if(thegame.player_client) {
                            //tell them the game is over
                        thegame.player_client.send('s.e');
                            //now look for/create a new game.
                        this.find_game(thegame.player_client);
                    }
                    
                } else {
                        //the other player left, we were hosting
                    if(thegame.player_host) {
                            //tell the client the game is ended
                        thegame.player_host.send('s.e');
                            //i am no longer hosting, this game is going down
                        thegame.player_host.hosting = false;
                            //now look for/create a new game.
                        this.find_game(thegame.player_host);
                    }
                }
            }

            delete this.games[gameid];
            this.game_count--;

            

        } 

    }; //game_server.endGame
