//   global.window = global.document = global;

var game_logic = function (game_instance) {
    
    	var p_width = 400;
	var p_height = 200;
	var ball_radius = 5;
    
    this.start = {
		speed : 0.1,
		radius : ball_radius,
		self : {
			x : -p_width / 2 + 8 * ball_radius,
			y : p_height / 8,
			rotation : Math.PI/2,
                        color : 0x6666FF,
                        color_hash : '#6666FF'
			},
                other : {
                        x : -p_width / 2 + 8 * ball_radius,
			y : -p_height / 8,
			rotation : Math.PI/2,
                        color : 0xD43001,
                        color_hash : '#D43001'
			},
		obstacles : {},
		height : 480,
		width : 720,
		obstacle_depth : 10,
		obstacle_width : 40,
                obstacle_height : 10,
		wall_depth : 20,
		planeWidth : p_width,
		planeHeight : p_height
	};
    
    if (game_instance)
        this.server = true;
    else
        this.server = false;
    //this.instance = start.host;
    //this.server = this.instance !== undefined;
    //document.getElementById("scores").innerHTML = server;

    if (this.server) {
        this.players = {
            self: new game_player(this.start),
            other: new game_player(this.start)
        };
        this.players.self.instance = game_instance.player_host;
        this.is_host(true);
    }


    else
        this.players = {
            self: new game_player(this.start),
            other: new game_player(this.start)
        };

    this.constants = {
        mouse_speed: 0.02,
        ball_speed: 0,
        speed: this.start.speed,
        ball_radius: this.start.radius, //used for limits, slightly smaller than visual radius
        field_width: this.start.planeWidth,
        field_height: this.start.planeHeight,
        fps: 15,
        ball_collision_delay: 3
    };

    this.obstacles = [];

    this.set_obstacles(this.makeObstacles());
    this.update_time = Date.now();
    if (!this.server)
        this.connect();
    this.debug_increment = 0;
    this.server_delay = 0;
    this.ball_collision=0;
    this.score = {red: 0, blue: 0};
};



if ('undefined' != typeof global) {
    module.exports = global.game_logic = game_logic;
}



var game_player = function (start) {
    this.ball = {
        pos: {
            x: start.self.x,
            y: start.self.y
        },
        old_pos: {
            x: start.self.x,
            y: start.self.y
        },
        temp_pos: {
            x: start.self.x,
            y: start.self.y
        },
        angle: 0,
        arrow: {
            active: false,
            angle: 0,
            last_rot: 0
        },
        color : 0x6666FF,
        color_updated : false,
        hor_speed: 0,
        ver_speed: 0
    };
    this.inputs = [];
    this.input_seq = 0;
//	this.input_seq = {
//			start: 0,
//			checked: 0,
//			end:0
//		};

    //this.input_log = [];
    this.input_log = {};
    this.mouseDown = false;
    //this.instance = player_instance;
    this.host = false;
    //if (this.instance) this.is_host();
    this.ping = 0;
};

game_player.prototype.is_host = function(){
    this.host = true;
    //this.ball.pos.x = this.ball.old_pos.x = this.ball.temp_pos.x = -this.ball.pos.x;
    this.ball.pos.y = this.ball.old_pos.y = this.ball.temp_pos.y = -this.ball.pos.y;
    
    this.ball.color = 0x6666FF;
    this.ball.color_updated = true;
    
};

game_logic.prototype.is_host = function(self){
   //document.getElementById("scores").innerHTML = 'entered ' + self;
  this.players.self.host = self;
  this.players.other.host = !self;
  if (self){
      
      this.players.self.ball.pos.y = this.players.self.ball.old_pos.y = this.players.self.ball.temp_pos.y = this.start.self.y;
      this.players.other.ball.pos.y = this.players.other.ball.old_pos.y = this.players.other.ball.temp_pos.y = this.start.other.y;
      
      this.players.self.ball.color = this.start.self.color;
      this.players.other.ball.color = this.start.other.color;
      
  }
  else {
      this.players.self.ball.pos.y = this.players.self.ball.old_pos.y = this.players.self.ball.temp_pos.y = this.start.other.y;
      this.players.other.ball.pos.y = this.players.other.ball.old_pos.y = this.players.other.ball.temp_pos.y = this.start.self.y;
      
      this.players.self.ball.color = this.start.other.color;
      this.players.other.ball.color = this.start.self.color;
  }
  
  this.players.self.ball.color_updated = this.players.other.ball.color_updated = true;
  
};

var input_log_node = function (angle, time, seq) {
    this.angle = angle;
    this.time = time;
    this.seq = seq;
    this.apply_time = {start: 0, end: 0};
    this.next = null;
};

game_logic.prototype.set_obstacles = function (obst) {
    var out_limits = {
        bottom: this.constants.field_height / 2,
        top: -this.constants.field_height / 2,
        right: -this.constants.field_width / 2,
        left: 3*this.constants.field_width / 4,
        hor_max: this.constants.field_width / 2,
        hor_min: -this.constants.field_width / 2,
        ver_max: this.constants.field_height / 2,
        ver_min: -this.constants.field_height / 2
    };
    this.obstacles.push(out_limits);

    if (obst)
        for (var i = 0; i < obst.length; i++){
            this.obstacles.push(obst[i]);
        }
};

game_logic.prototype.check_collision = function(){
    this.check_obstacle_collision(this.players.self);
    this.check_obstacle_collision(this.players.other);
    this.check_ball_collision();
    
};

game_logic.prototype._check_obstacle_collision = function (player) {
    var obstacle_check;
    var change = false;
    for (var i = 0; i < this.obstacles.length; i++) {
        obstacle_check = this.obstacles[i];
        if (player.ball.pos.x > obstacle_check.hor_min && player.ball.pos.x < obstacle_check.hor_max &&
                (
                        ((player.ball.old_pos.y + this.constants.ball_radius <= obstacle_check.bottom) && ((player.ball.pos.y + this.constants.ball_radius) >= obstacle_check.bottom) && (player.ball.ver_speed > 0))
                        ||
                        ((player.ball.old_pos.y - this.constants.ball_radius >= obstacle_check.top) && ((player.ball.pos.y - this.constants.ball_radius) <= obstacle_check.top) && (player.ball.ver_speed < 0))
                        )
                )
        {
            player.ball.ver_speed = -player.ball.ver_speed;
            player.ball.angle = -player.ball.angle;
            change = true;
        }


        if (player.ball.pos.y > obstacle_check.ver_min && player.ball.pos.y < obstacle_check.ver_max &&
                (
                        ((player.ball.old_pos.x + this.constants.ball_radius <= obstacle_check.left) && ((player.ball.pos.x + this.constants.ball_radius) >= obstacle_check.left) && (player.ball.hor_speed > 0))
                        ||
                        ((player.ball.old_pos.x - this.constants.ball_radius >= obstacle_check.right) && ((player.ball.pos.x - this.constants.ball_radius) <= obstacle_check.right) && (player.ball.hor_speed < 0))
                        )
                )
        {
            player.ball.hor_speed = -player.ball.hor_speed;
            player.ball.angle = Math.PI - player.ball.angle;
            change = true;
        }

    }
    return change;
};

game_logic.prototype.check_obstacle_collision = function (player) {
    var obstacle_check;
    var change = false;
    for (var i = 0; i < this.obstacles.length; i++) {
        obstacle_check = this.obstacles[i];
        if (player.ball.pos.x > obstacle_check.hor_min && player.ball.pos.x < obstacle_check.hor_max &&
                (
                        ((player.ball.pos.y <= obstacle_check.bottom) && ((player.ball.pos.y + this.constants.ball_radius) >= obstacle_check.bottom) && (player.ball.ver_speed > 0))
                        ||
                        ((player.ball.pos.y >= obstacle_check.top) && ((player.ball.pos.y - this.constants.ball_radius) <= obstacle_check.top) && (player.ball.ver_speed < 0))
                        )
                )
        {
            player.ball.ver_speed = -player.ball.ver_speed;
            player.ball.angle = -player.ball.angle;
            if (!player.ball.arrow.active) player.ball.arrow.angle = player.ball.angle;
            change = true;
        }


        if (player.ball.pos.y > obstacle_check.ver_min && player.ball.pos.y < obstacle_check.ver_max &&
                (
                        ((player.ball.pos.x <= obstacle_check.left) && ((player.ball.pos.x + this.constants.ball_radius) >= obstacle_check.left) && (player.ball.hor_speed > 0))
                        ||
                        ((player.ball.pos.x>= obstacle_check.right) && ((player.ball.pos.x - this.constants.ball_radius) <= obstacle_check.right) && (player.ball.hor_speed < 0))
                        )
                )
        {
            player.ball.hor_speed = -player.ball.hor_speed;
            player.ball.angle = Math.PI - player.ball.angle;
            if (!player.ball.arrow.active) player.ball.arrow.angle = player.ball.angle;
            change = true;
        }

    }
    return change;
};

game_logic.prototype.check_ball_collision = function(){
    if (this.get_distance(this.players.self.ball.pos, this.players.other.ball.pos)<this.constants.ball_radius*2 && !this.ball_collision){
        this.ball_collision = this.constants.ball_collision_delay;
        var temp_angle = this.players.self.ball.angle;
        this.players.self.ball.angle = this.players.self.ball.arrow.angle = this.players.other.ball.angle;
        if (!this.players.self.ball.arrow.active) this.players.self.ball.arrow.angle = this.players.self.ball.angle;
        this.players.other.ball.angle = this.players.other.ball.arrow.angle = temp_angle;
        this.launch_ball(this.players.self);
        this.launch_ball(this.players.other);
    }
    else if (this.ball_collision)
        this.ball_collision--;
};


/*game_logic.prototype.apply_inputs = function(player) {
 if (player.inputs[0]) {
 if (player.inputs[0].mouse_down || player.ball.arrow.active) {
 player.ball.arrow.active = true;
 var i=0;
 while (player.inputs[i] && player.inputs[i].mouse_down)
 i++;
 player.ball.arrow.angle = this.get_angle(player.inputs[i-1],player.ball.pos);
 if (player.inputs[i]) { //meaning we exited while because mouse is not down
 player.ball.arrow.active = false;
 player.ball.angle=player.ball.arrow.angle;
 this.launch_ball(player);
 this.shift_inputs(player,i+1);
 }
 }
 else {
 this.shift_inputs(player,1);
 }
 player.inputs = []; //inputs have been handled, reset them
 }
 };
 
 game_logic.prototype.shift_inputs = function(player,pos){
 while (player.inputs[pos] && !player.inputs[pos].mouse_down)
 pos++;
 if (player.inputs[pos]){
 player.inputs.splice(0,pos);
 this.apply_inputs(player);
 }
 };*/

game_logic.prototype.apply_inputs = function (player) {

    if (player.inputs[0]) {
        var i = 0;
        if (player.inputs[0].mouse_down) {
            player.ball.arrow.active = true;
            i = this.getLastInput(player, 1);
            player.ball.arrow.angle = this.get_angle(player.inputs[i], player.ball.pos);
            i++;
        }
        if (player.inputs[i] && player.ball.arrow.active) {
            //means it's a mouse up input
            player.ball.angle = player.ball.arrow.angle = this.get_angle(player.inputs[i], player.ball.pos);

            //list log	    
            if (player.input_log.head) {
                player.input_log.tail.next = new input_log_node(player.ball.angle, player.inputs[i].time, player.input_seq + 1);
                player.input_log.tail = player.input_log.tail.next;
                player.input_seq++;
            } else {
                player.input_log.head = new input_log_node(player.ball.angle, player.inputs[i].time, player.input_seq);
                player.input_log.tail = player.input_log.head;
                player.input_seq++;
            }

            //array log
            //player.input_seq.end++;
            //player.input_log[player.input_seq.end] = {angle: player.ball.angle, time: player.inputs[i].time, seq: player.input_seq.end};

            this.launch_ball(player);
            player.ball.arrow.active = false;
            if (this.cleanDeadInputs(player, i + 1))
                this.apply_inputs(player);
        }
        player.inputs = [];
    }
};

game_logic.prototype.apply_input = function (player, input) {
    if (input.mouse_down) {
        if (player.ball.arrow.active===false)
            this.input_pos = input.x;
        player.ball.arrow.angle += (this.input_pos - input.x)*this.constants.mouse_speed;
        this.input_pos = input.x;
        player.ball.arrow.active = true;
        //player.ball.arrow.angle = this.get_angle(input, player.ball.pos);
    } else if (player.ball.arrow.active) {
        player.ball.angle = player.ball.arrow.angle;
        //player.ball.angle = player.ball.arrow.angle = this.get_angle(input, player.ball.pos);
        //player.ball.arrow.angle = this.get_angle(input, player.ball.pos);
        //list log
        if (player.input_log.head) {
            player.input_log.tail.next = new input_log_node(player.ball.angle, input.time, (player.input_seq + 1));
            player.input_log.tail = player.input_log.tail.next;
            player.input_seq++;
        } else {
            player.input_log.head = new input_log_node(player.ball.angle, input.time, player.input_seq);
            player.input_log.tail = player.input_log.head;
            player.input_seq++;
        }


        //array log
        //player.input_seq.end++;
        //player.input_log[player.input_seq.end] = {angle: player.ball.angle, time: input.time, apply_time: 0, seq: player.input_seq.end, active : false};
        //this.socket.send('i-'+player.input_log.tail.angle+'-'+player.input_log.tail.time+'-'+player.input_log.tail.seq+'-'+player.input_log.tail.apply_time);
        var host;
        if (player.host) host = 'h';
        else host = 'c';
        var message_sent = 'i'+'='+ player.ball.arrow.angle + '=' + player.input_log.tail.time + '=' + player.input_log.tail.seq+'='+host;
        this.socket.send(message_sent);
        //document.getElementById("scores").innerHTML = message_sent;
        this.launch_ball(player);
        player.ball.arrow.active = false;
    }
};

game_logic.prototype.getLastInput = function (player, pos) {
    while (player.inputs[pos] && player.inputs[pos].mouse_down)
        pos++;
    return(pos - 1);
};

game_logic.prototype.cleanDeadInputs = function (player, pos) {

    while (player.inputs[pos] && !player.inputs[pos].mouse_down)
        pos++;
    player.inputs.splice(0, pos);
    if (player.inputs[0])
        return true;
    return false;
};


game_logic.prototype._physics_update = function (player) {
    //document.getElementById("scores").innerHTML = this.players.self.ball.ver_speed + "-" + this.players.self.ball.pos.y;
    //document.getElementById("scores").innerHTML = this.players.self.ball.ver_speed + "-" + this.players.self.ball.hor_speed;

    //this.apply_inputs(player);

    var curdate = Date.now();

    //list log
    if (player.input_log.head && !player.input_log.tail.apply_time.start) {
        player.input_log.tail.apply_time.start = this.update_time;
        player.input_log.tail.apply_time.end = curdate;
    }

    //array log	
    //if (player.input_log[player.input_seq.end].apply_time)
    //	player.input_log[player.input_seq.end].apply_time = curdate;

    var dt = curdate - this.update_time;
    this.update_time = curdate;

    player.ball.old_pos.x = player.ball.pos.x;
    player.ball.old_pos.y = player.ball.pos.y;
    player.ball.pos.x += player.ball.hor_speed * dt;
    player.ball.pos.y += player.ball.ver_speed * dt;
    
    this.check_obstacle_collision(player);
    //if (Math.abs(player.ball.pos.x)>500 || Math.abs(player.ball.pos.y)>500)
    //    document.getElementById("scores").innerHTML = player.ball.hor_speed + ' ' + player.ball.ver_speed + ' ' + dt;

};

game_logic.prototype.physics_update = function () {

    var curdate = Date.now();
    var player = this.players.self,
    opponent = this.players.other;
    //list log
    if (player.input_log.head && !player.input_log.tail.apply_time.start) {
        player.input_log.tail.apply_time.start = this.update_time;
        player.input_log.tail.apply_time.end = curdate;
    }

    
    var dt = curdate - this.update_time;
    this.update_time = curdate;

    player.ball.old_pos.x = player.ball.pos.x;
    player.ball.old_pos.y = player.ball.pos.y;
    player.ball.pos.x += player.ball.hor_speed * dt;
    player.ball.pos.y += player.ball.ver_speed * dt;
    
    opponent.ball.old_pos.x = opponent.ball.pos.x;
    opponent.ball.old_pos.y = opponent.ball.pos.y;
    opponent.ball.pos.x += opponent.ball.hor_speed * dt;
    opponent.ball.pos.y += opponent.ball.ver_speed * dt;
    
    
    this.check_collision();
    
    
};

game_logic.prototype.server_update = function(){
    this.constants.ball_speed = this.constants.speed;
    this.launch_ball(this.players.self);
    this.launch_ball(this.players.other);
    
    this.intervalid = setInterval(this.server_physics_update.bind(this),15);
	this.intervalid2 = setInterval(this.server_send_correction.bind(this),75);
    this.stopped = false;
    console.log('entered server_update');
};

game_logic.prototype.stop_update = function(){
  clearInterval(this.intervalid);
	clearInterval(this.intervalid2);
  this.stopped = true;
};

game_logic.prototype._server_physics_update = function () {
    //console.log(this.players.self.ball.pos.x+' '+this.players.other.ball.pos.x)
    var curdate = Date.now() - this.server_delay;
    var old_angle = this.players.self.ball.angle;
    var updated = false;
    if (this.players.self.input_log.head)
        updated = this.server_angle(this.players.self, curdate);

    var dt = curdate - this.update_time;
    this.update_time = curdate;
    this.players.self.ball.pos.x += this.players.self.ball.hor_speed * dt;
    this.players.self.ball.pos.y += this.players.self.ball.ver_speed * dt;
    var change = this.check_obstacle_collision(this.players.self);
    if (change)
        //console.log('changed from ' + old_angle + ' to ' + this.players.self.ball.angle);

    //send data
    var host_update = {
        pos: {x: this.players.self.ball.pos.x,
            y: this.players.self.ball.pos.y},
        angle: this.players.self.ball.angle,
        time: curdate,
        seq: this.players.self.inputs_seq
    };
    if (this.players.self.instance && (this.players.self.ball.angle !== old_angle))
        this.players.self.instance.emit('onserverupdate', host_update);
    //else console.log(this.players.self.ball.angle +'  '+old_angle);
};

game_logic.prototype.server_physics_update = function () {
    //console.log('x1: '+this.players.self.ball.pos.x+' x2: '+this.players.other.ball.pos.x);
    if (this.stopped) console.log('stop error');
    var curdate = Date.now() - this.server_delay;
    var dt = curdate - this.update_time;
    this.update_time = curdate;
    var selfenter=false, otherenter=false;
    //var curdate = Date.now();
    var old_angle_self = this.players.self.ball.angle;
    var old_angle_other = this.players.other.ball.angle;
    if (this.players.self.input_log.head){
        this.server_angle(this.players.self, curdate);
        selfenter=true;
    }
    if (this.players.other.input_log.head){
        otherenter=true;
        this.server_angle(this.players.other, curdate);
    }
    


    
    this.players.self.ball.pos.x += this.players.self.ball.hor_speed * dt;
    this.players.self.ball.pos.y += this.players.self.ball.ver_speed * dt;
    
    this.players.other.ball.pos.x += this.players.other.ball.hor_speed * dt;
    this.players.other.ball.pos.y += this.players.other.ball.ver_speed * dt;
    
    if (this.players.self.ball.pos.x>this.constants.field_width/2){
        return this.server_handle_endgame('b');
    }
    else if (this.players.other.ball.pos.x>this.constants.field_width/2){
        return this.server_handle_endgame('r');
    }
        
    
    //if (Math.abs(this.players.self.ball.pos.x) > 300)
    //    console.log('exceed pos, time '+dt);
    
    this.check_collision();

    //send data
    var host_update = {
        pos: {x: this.players.self.ball.pos.x,
            y: this.players.self.ball.pos.y},
        angle: this.players.self.ball.angle,
        time: curdate,
        seq: this.players.self.inputs_seq
    };
    
    var client_update = {
        pos: {x: this.players.other.ball.pos.x,
            y: this.players.other.ball.pos.y},
        angle: this.players.other.ball.angle,
        time: curdate,
        seq: this.players.other.inputs_seq
    };
    
    
    if (this.players.self.instance && this.players.other.instance &&
            ((this.players.self.ball.angle !== old_angle_self) || (this.players.other.ball.angle !== old_angle_other))){
          //console.log(this.players.self.ball.pos.x+' '+this.players.other.ball.pos.x);
    
        this.players.self.instance.emit('onserverupdate', {self: host_update, other: client_update});
        this.players.other.instance.emit('onserverupdate', {self: client_update, other: host_update});
        this.input_debug_flag = false;
    }
    else if (this.input_debug_flag){
        var self_flag = false, other_flag = false;
        if (this.players.self.instance) self_flag = true;
        if (this.players.other.instance) other_flag = true;
        //console.log(self_flag+' '+other_flag+' '+this.players.self.ball.angle+' '+old_angle_self+' '+this.players.other.ball.angle+' '+old_angle_other
        //        +' '+selfenter+' '+otherenter+' '+this.server_delay);
        this.input_debug_flag = false;
    }
        
    //else console.log(this.players.self.ball.angle +'  '+old_angle);
};

game_logic.prototype.server_angle = function (player, time) {
    var headtime =0;
    while (player.input_log.head && player.input_log.head.time < time){
        headtime = headtime=player.input_log.head.time;
        player.input_log.head = player.input_log.head.next;
    }
    if (player.input_log.head && player.input_log.head.time >= this.update_time) {
        player.ball.angle = player.input_log.head.angle;
        this.launch_ball(player);
        player.inputs_seq = player.input_log.head.seq;
        player.input_log.head = player.input_log.head.next;
        return true;
    }
    else {
        if (player.input_log.head)
            console.log('head angle time: '+player.input_log.head.time+', update_time: '+this.update_time);
        else console.log('last head < time, '+headtime+' '+time);
    }
    return false;
};

game_logic.prototype.server_handle_input = function (client, input) {
    var player =
        (client.userid == this.players.self.instance.userid) ?
            this.players.self : this.players.other;
    if (player.input_log.head) {
        player.input_log.tail.next = input;
        player.input_log.tail = input;
    } else {
        player.input_log.head = player.input_log.tail = input;
    }
    this.input_debug_flag = true;
    //console.log(input.angle);

};

game_logic.prototype.server_send_correction = function(){
    var curdate = Date.now() - this.server_delay;
    var host_update = {
        pos: {x: this.players.self.ball.pos.x,
            y: this.players.self.ball.pos.y},
        angle: this.players.self.ball.angle,
        time: curdate,
        seq: this.players.self.inputs_seq
    };
    
    var client_update = {
        pos: {x: this.players.other.ball.pos.x,
            y: this.players.other.ball.pos.y},
        angle: this.players.other.ball.angle,
        time: curdate,
        seq: this.players.other.inputs_seq
    };
    this.players.self.instance.emit('onserverupdate', {self: host_update, other: client_update});
    this.players.other.instance.emit('onserverupdate', {self: client_update, other: host_update});
};

game_logic.prototype.___client_correction = function (proc_inputs) {
    var debug_inc = 0;
    //document.getElementById("scores").innerHTML = 'debug '+(this.debug_increment++);
    //console.log('debug '+(this.debug_increment++));
    var player = this.players.self;
    player.ball.pos.x = proc_inputs.pos.x;
    player.ball.pos.y = proc_inputs.pos.y;
    player.ball.angle = proc_inputs.angle;
    this.launch_ball(player);
    while (player.input_log.head.seq < proc_inputs.seq) {
        player.input_log.head = player.input_log.head.next;
    }

    var time_processed = proc_inputs.time;
    var input_processing = player.input_log.head;

    if (player.input_log.head && player.input_log.head.apply_time)
        debug_inc = player.input_log.head.apply_time.start;
    if (player.input_log.head)
        player.input_log.head = player.input_log.head.next;
    var dt;
    //document.getElementById("scores").innerHTML = time_processed +' - '+ Date.now();

    while (input_processing && input_processing.apply_time && input_processing.apply_time.start) {
        dt = this.constants.fps;

        while (time_processed + dt < input_processing.apply_time.start) {
            time_processed += this.ball_step(player, dt);
        }


        dt = input_processing.apply_time.start - time_processed;

        //time_processed = dt = input_processing.apply_time.start - time_processed;
        player.ball.pos.x += player.ball.hor_speed * dt;
        player.ball.pos.y += player.ball.ver_speed * dt;
        time_processed = input_processing.apply_time.start;
        dt = input_processing.apply_time.end - input_processing.apply_time.start;
        player.ball.angle = input_processing.angle;
        this.launch_ball(player);

        time_processed += this.ball_step(player, dt);

        input_processing = input_processing.next;
    }


    dt = this.constants.fps;
    this.update_time = Date.now();
    while (time_processed < this.update_time - dt) {
        time_processed += this.ball_step(player, dt);
    }
    this.ball_step(player, this.update_time - time_processed);
    //document.getElementById("scores").innerHTML = player.ball.pos.x + ' - ' + proc_inputs.pos.x + ' | ' + proc_inputs.time + ' - ' + debug_inc;
};

game_logic.prototype._client_correction = function (proc_inputs) {
    var player = this.players.self;
    player.ball.pos.x = proc_inputs.pos.x;
    player.ball.pos.y = proc_inputs.pos.y;
    player.ball.angle = proc_inputs.angle;
    this.launch_ball(player);
    var curdate = Date.now();
    this.update_time = curdate;
    var timestamp = proc_inputs.time;
    while (timestamp + this.constants.fps < curdate)
        timestamp += this.ball_step(player, this.constants.fps);
    var dt = curdate - timestamp;
    this.ball_step(player, dt);
};

game_logic.prototype.__client_correction = function (proc_inputs) {
    //.getElementById("scores").innerHTML = 'entered';

    var player = this.players.self;
    player.ball.pos.x = proc_inputs.pos.x;
    player.ball.pos.y = proc_inputs.pos.y;
    player.ball.angle = proc_inputs.angle;
    this.launch_ball(player);
    var curdate = Date.now();
    this.update_time = curdate;
    this.ball_step(player, curdate - proc_inputs.time);
};

game_logic.prototype.client_correction = function (proc_inputs) {
    var debug_inc = 0;
    this.constants.ball_speed = this.constants.speed;
    document.getElementById("winnerBoard").innerHTML = 'Race to the finish!';
    //document.getElementById("scores").innerHTML = 'entered';
    //document.getElementById("scores").innerHTML = 'debug '+(this.debug_increment++);
    //console.log('debug '+(this.debug_increment++));
    var player = this.players.self, opponent = this.players.other;
    
	var prevposx = player.ball.pos.x;
	var prevposy = player.ball.pos.y;
	
    player.ball.pos.x = proc_inputs.self.pos.x;
    player.ball.pos.y = proc_inputs.self.pos.y;
    player.ball.angle = proc_inputs.self.angle;
    if (!player.ball.arrow.active) player.ball.arrow.angle = player.ball.angle;
    this.launch_ball(player);
    
    opponent.ball.pos.x = proc_inputs.other.pos.x;
    opponent.ball.pos.y = proc_inputs.other.pos.y;
    opponent.ball.angle = opponent.ball.arrow.angle = proc_inputs.other.angle;
    this.launch_ball(opponent);
    
    
    while (player.input_log.head && player.input_log.head.seq < proc_inputs.self.seq) {
        player.input_log.head = player.input_log.head.next;
    }

    var time_processed = proc_inputs.self.time;
    var input_processing = player.input_log.head;

    if (player.input_log.head && player.input_log.head.apply_time)
        debug_inc = player.input_log.head.apply_time.start;
    if (player.input_log.head)
        player.input_log.head = player.input_log.head.next;
    var dt;
    //document.getElementById("scores").innerHTML = time_processed +' - '+ Date.now();

            //document.getElementById("scores").innerHTML = 'debug '+(this.debug_increment++);

    //document.getElementById("scores").innerHTML = 'debug '+(this.debug_increment++);

    while (input_processing && input_processing.apply_time && input_processing.apply_time.start) {
        dt = this.constants.fps;

        while (time_processed + dt < input_processing.apply_time.start) {
            time_processed += this.ball_step(dt);
        }


        dt = input_processing.apply_time.start - time_processed;

        //time_processed = dt = input_processing.apply_time.start - time_processed;
        player.ball.pos.x += player.ball.hor_speed * dt;
        player.ball.pos.y += player.ball.ver_speed * dt;
        
        opponent.ball.pos.x += opponent.ball.hor_speed * dt;
        opponent.ball.pos.y += opponent.ball.ver_speed * dt;
        
        time_processed = input_processing.apply_time.start;
        dt = input_processing.apply_time.end - input_processing.apply_time.start;
        player.ball.angle = input_processing.angle;
        if (!player.ball.arrow.active) player.ball.arrow.angle = player.ball.angle;
        this.launch_ball(player);

        time_processed += this.ball_step(dt);

        input_processing = input_processing.next;
    }


    dt = this.constants.fps;
    this.update_time = Date.now();
    while (time_processed < this.update_time - dt) {
        time_processed += this.ball_step(dt);
    }
    this.ball_step(this.update_time - time_processed);
	 document.getElementById("scores").innerHTML = (player.ball.pos.x-prevposx)+' - '+(player.ball.pos.y-prevposy);
	console.log('x dif: '+(player.ball.pos.x-prevposx)+', y dif: '+(player.ball.pos.y-prevposy));
	if (Math.abs(player.ball.pos.x-prevposx)<1.5 && Math.abs(player.ball.pos.y-prevposy)<1.5){
		player.ball.pos.x = prevposx; player.ball.pos.y = prevposy;
    //document.getElementById("scores").innerHTML = player.ball.pos.x + ' - ' + proc_inputs.pos.x + ' | ' + proc_inputs.time + ' - ' + debug_inc;
};

game_logic.prototype._naive_update = function (proc_input) {
    this.players.self.ball.angle = proc_input.angle;
    this.launch_ball(this.players.self);
    this.players.self.ball.pos.x = proc_input.pos.x;
    this.players.self.ball.pos.y = proc_input.pos.y;

};

game_logic.prototype.naive_update = function (proc_input) {
    this.players.self.ball.angle = proc_input.self.angle;
    this.launch_ball(this.players.self);
    this.players.other.ball.angle = proc_input.other.angle;
    this.launch_ball(this.players.other);
    this.players.self.ball.pos.x = proc_input.self.pos.x;
    this.players.self.ball.pos.y = proc_input.self.pos.y;
    this.players.other.ball.pos.x = proc_input.other.pos.x;
    this.players.other.ball.pos.y = proc_input.other.pos.y;

};

game_logic.prototype._ball_step = function (player, dt) {
    player.ball.pos.x += player.ball.hor_speed * dt;
    player.ball.pos.y += player.ball.ver_speed * dt;
    this.check_obstacle_collision(player);
    return dt;
};

game_logic.prototype.ball_step = function (dt) {
    this.players.self.ball.pos.x += this.players.self.ball.hor_speed * dt;
    this.players.self.ball.pos.y += this.players.self.ball.ver_speed * dt;
    
    this.players.other.ball.pos.x += this.players.other.ball.hor_speed * dt;
    this.players.other.ball.pos.y += this.players.other.ball.ver_speed * dt;
    
    this.check_collision();
    return dt;
};

game_logic.prototype.get_angle = function (positions_end, positions_start) {
    return Math.atan((positions_end.y - positions_start.y) / (positions_end.x - positions_start.x));
};

game_logic.prototype.get_distance = function (pos_start, pos_end){
    return Math.sqrt(Math.pow((pos_start.x-pos_end.x),2) + Math.pow((pos_start.y-pos_end.y),2));
};

game_logic.prototype.launch_ball = function (player) {
    player.ball.hor_speed = Math.cos(player.ball.angle) * this.constants.ball_speed;
    player.ball.ver_speed = Math.sin(player.ball.angle) * this.constants.ball_speed;
};

game_logic.prototype.connect = function () {
    this.socket = io.connect();

    this.socket.on('connect', function () {
        this.players.self.state = 'connecting';
    }.bind(this));

    this.socket.on('onserverupdate', this.client_correction.bind(this));
    //this.socket.on('onserverupdate', this.naive_update.bind(this));
    this.socket.on('message', this.onmessage.bind(this));
    this.socket.on('onconnected', this.onconnected.bind(this));
};

game_logic.prototype.ping_respond = function (data) {
    this.socket.send('p'+'=' + Date.now());
    if (data==='h')
        this.is_host(true);
    else
        this.is_host(false);
};

game_logic.prototype.onmessage = function (data) {
    var message = data.split('=');
    switch (message[0]){
        case 'p': this.ping_respond(message[1]);
            break;
        case 's.e': this.end_game();
            break;
        case 'e' : this.handle_endgame(message[1]);
            break;
    }
};

game_logic.prototype.onconnected = function(data){
    this.players.self.id = data.id;
    this.players.self.state = 'connected';
    this.players.self.online = true;
};

game_logic.prototype.end_game = function(){
    
    this.constants.ball_speed = 0;
    document.getElementById("winnerBoard").innerHTML = 'Waiting for players...';
    this.reset_players();
};



game_logic.prototype.reset_players = function(){
    var my_id = this.players.self.id;
    var host = this.players.self.host;
    this.players.self = new game_player(this.start);
    this.players.other = new game_player(this.start);
    this.players.self.id = my_id;
    this.players.self.host = host;
    this.players.other.host = !host;
    this.is_host(host);
    this.constants.ball_speed = 0;
};



game_logic.prototype.handle_endgame = function (winner){
    this.reset_players();
    if (winner==='b')
        this.score.blue++;
    else
        this.score.red++;
    //document.getElementById("scores").innerHTML = this.score.blue + '-' + this.score.red;
    document.getElementById("scores").innerHTML = '<span style="color:'+this.start.self.color_hash+'">'+this.score.blue+'</span>' + '-' +
            '<span style="color:'+this.start.other.color_hash+'">'+this.score.red+'</span>';
    this.socket.send('r');
};

game_logic.prototype.server_handle_endgame = function (winner){
    console.log('entered endgame');
    this.players.self.instance.send('e='+winner);
    this.players.other.instance.send('e='+winner);
    this.stop_update();
    return true;
};

game_logic.prototype.restart_game = function (){
    console.log('entered restart');
        var selfinstance = this.players.self.instance;
    var otherinstance = this.players.other.instance;
    this.reset_players();
    this.players.self.instance = selfinstance;
    this.players.other.instance = otherinstance;
    this.server_update();
    this.server_send_correction();
}

game_logic.prototype.makeObstacles = function() {
    var obstacleWidth = this.start.obstacle_width, fieldWidth = this.start.planeWidth,fieldHeight=this.start.planeHeight,     obstacleHeight = this.start.obstacle_height,
    obstacleDepth = this.start.obstacle_depth;
    
    var obstacle = [
        {pos:{x:-7 * fieldWidth / 16 + obstacleWidth,y:1 * fieldHeight / 4} },
        {pos:{x:-7 * fieldWidth / 16 + obstacleWidth,y:-1 * fieldHeight / 4} },
        {pos:{x:-7 * fieldWidth / 16 + obstacleWidth,y:0} },
        {pos:{x:-4 * fieldWidth / 16 + obstacleWidth,y:0.5 * fieldHeight / 4} },
        {pos:{x:-4 * fieldWidth / 16 + obstacleWidth,y:-0.5* fieldHeight / 4} },
        {pos:{x:-4 * fieldWidth / 16 + obstacleWidth,y:1.5* fieldHeight / 4} },
        {pos:{x:-4 * fieldWidth / 16 + obstacleWidth,y:-1.5* fieldHeight / 4} },
        {pos:{x:-1 * fieldWidth / 16 + obstacleWidth,y:1* fieldHeight / 4} },
        {pos:{x:-1 * fieldWidth / 16 + obstacleWidth,y:-1* fieldHeight / 4} },
        {pos:{x:3 * fieldWidth / 16 + obstacleWidth,y:0.4* fieldHeight / 4} },
        {pos:{x:3 * fieldWidth / 16 + obstacleWidth,y:-0.4* fieldHeight / 4} },
        {pos:{x:3 * fieldWidth / 16 + 2*obstacleWidth,y:0.4* fieldHeight / 4} },
        {pos:{x:3 * fieldWidth / 16 + 2*obstacleWidth,y:-0.4* fieldHeight / 4} },
        {pos:{x:-1 * fieldWidth / 16 + obstacleWidth,y:0} },
        
        {pos:{x:-1 * fieldWidth / 16 + 0.5 * (obstacleWidth + obstacleHeight),y:fieldHeight / 4 + 0.5 * (obstacleWidth + obstacleHeight)} },
        {pos:{x:-1 * fieldWidth / 16 + 0.5 * (obstacleWidth + obstacleHeight),y:-fieldHeight / 4 - 0.5 * (obstacleWidth + obstacleHeight)} },
        {pos:{x:3 * fieldWidth / 16 + 0.5 * (obstacleWidth + obstacleHeight),y:0.4 * fieldHeight / 4 + 0.8 * (obstacleWidth + obstacleHeight)} },
        {pos:{x:3 * fieldWidth / 16 + 0.5 * (obstacleWidth + obstacleHeight),y:-0.4 * fieldHeight / 4 - 0.8 * (obstacleWidth + obstacleHeight)} }
        
    ];
        for (var i=0;i<14;i++){
            obstacle[i].width = obstacleWidth;
            obstacle[i].height = obstacleHeight;
            obstacle[i].depth = obstacleDepth;
            
        }
        for (var i=14;i<16;i++){
            obstacle[i].width = obstacleHeight;
            obstacle[i].height = 1.4*obstacleWidth;
            obstacle[i].depth = obstacleDepth;
        }
        
        for (var i=16;i<18;i++){
            obstacle[i].width = obstacleHeight;
            obstacle[i].height = 2*obstacleWidth;
            obstacle[i].depth = obstacleDepth;
        }
        
        for (var i=0;i<18;i++){
            obstacle[i].ver_min = obstacle[i].bottom = obstacle[i].pos.y - obstacle[i].height/2;
            obstacle[i].ver_max = obstacle[i].top = obstacle[i].pos.y + obstacle[i].height/2;
            obstacle[i].hor_max = obstacle[i].right = obstacle[i].pos.x + obstacle[i].width/2;
            obstacle[i].hor_min = obstacle[i].left = obstacle[i].pos.x - obstacle[i].width/2;
            
            
        }

        return obstacle;
    
};

