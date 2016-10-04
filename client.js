var logic = {};
var graphics = {};

var test =0;

window.onload = function() {
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
		obstacle_width : 40,
                obstacle_height : 10,
		wall_depth : 20,
		planeWidth : p_width,
		planeHeight : p_height
	};
	

	logic = new game_logic();
	graphics = new game_graphics(start);
	graphics.create_scene();	
        graphics.setObstacles(makeObstacles(start));
        //graphics.setObstaclesOwn();
        logic.client_update();
	draw();

	
};

function makeObstacles(start){
    var obstacleWidth = start.obstacle_width, fieldWidth = start.planeWidth,fieldHeight=start.planeHeight,     obstacleHeight = start.obstacle_height,
    obstacleDepth = start.obstacle_depth;
    
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
        
 /*      
       var obstacle = [{pos:{x:0,y:0}}];
       obstacle[0].width = obstacleWidth;
       obstacle[0].height = obstacleHeight;
       obstacle[0].depth = obstacleDepth;
       obstacle[0].ver_min = obstacle[0].bottom = obstacle[0].pos.y-obstacle[0].height/2;
       obstacle[0].ver_max = obstacle[0].top = obstacle[0].pos.y + obstacle[0].height/2;
       obstacle[0].hor_max = obstacle[0].right = obstacle[0].pos.x + obstacle[0].width/2;
       obstacle[0].hor_min = obstacle[0].left = obstacle[0].pos.x - obstacle[0].width/2; */
        return obstacle;
    
};

document.addEventListener('mousemove', onMouseUpdate, false);
document.addEventListener('mouseenter', onMouseUpdate, false);

document.onmousedown = function () {
    logic.players.self.mouseDown = true;
};
document.onmouseup = function () {
    logic.players.self.mouseDown = false;
};


function onMouseUpdate(e) {
    if (logic.players.self.mouseDown || logic.players.self.ball.arrow.active){
	input = {mouse_down : logic.players.self.mouseDown, x : e.pageX, y : e.pageY, time : Date.now()};
	//logic.players.self.inputs.push({mouse_down : logic.players.self.mouseDown, x : e.pageX, y : e.pageY, time : Date.now()});
	logic.apply_input(logic.players.self,input);
	}
}

function draw(){
//	if (logic.players.self.inputs[0])
//		document.getElementById("scores").innerHTML = logic.players.self.inputs[logic.players.self.inputs.length-1].x + "-" + logic.players.self.inputs.length;

	//logic.physics_update();
        if (logic.players.self.ball.color_updated){
            logic.players.self.ball.color_updated = ! graphics.update_ball_color(true, logic.players.self.ball.color);
        }
        if (logic.players.other.ball.color_updated) {
            logic.players.other.ball.color_updated = ! graphics.update_ball_color(false, logic.players.other.ball.color);
        }
        graphics.renderer.render(graphics.scene, graphics.camera);
	graphics.ballUpdate(logic.players.self.ball, logic.players.other.ball);
	graphics.theCamera();
	requestAnimationFrame(draw);
};
