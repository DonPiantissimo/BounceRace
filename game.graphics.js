var game_graphics = function(start){
	
	this.ball_values = {
		radius: start.radius,
		self : {
			pos : {
				x: start.self.x,
				y: start.self.y
				},
			rotation : start.self.rotation,
			color : 0xD43001
			},
                other : {
			pos : {
				x: start.self.x,
				y: start.self.y
				},
			rotation : start.self.rotation,
			color : 0xD43001
			},
		segments : 6,
		rings : 6
		};

	this.world = {
		height : start.height,
		width : start.width
		};

	this.plane_constants = {
		width : start.planeWidth,
		height : start.planeHeight,
		quality : 10,
		color : 0x4BD121
		};

	this.camera_constants = {
		view_angle : 50,
		aspect : this.world.width / this.world.height,
            	near : 0.1,
            	far : 1000,
		z_pos : 320
		};

	this.obstacle_constants = {
		obstacle_depth : start.obstacle_depth,
		wall_depth : start.wall_depth,
		wall_color : 0xFF4045
		};
        this.horWallMargin = 3 * start.planeWidth / 16 + 0.5 * (start.obstacle_width + start.obstacle_height);
};



game_graphics.prototype.create_scene = function() {
	
	this.doc = document.getElementById('gameCanvas');

	this.renderer = new THREE.WebGLRenderer();

        this.camera = new THREE.PerspectiveCamera(
            this.camera_constants.view_angle,
            this.camera_constants.aspect,
            this.camera_constants.near,
            this.camera_constants.far);

        this.scene = new THREE.Scene();
	
	this.scene.add(this.camera);

	this.camera.position.z = this.camera_constants.z_pos;

	this.renderer.setSize(this.world.width, this.world.height);
	
	this.doc.appendChild(this.renderer.domElement);



	var planeMaterial =
            new THREE.MeshLambertMaterial(
                    {
                        color: this.plane_constants.color
                    });

	var plane = new THREE.Mesh(
            new THREE.PlaneGeometry(
                    this.plane_constants.width,
                    this.plane_constants.height,
                    this.plane_constants.quality,
                    this.plane_constants.quality),
            planeMaterial);

	this.scene.add(plane);
        
        var lineMaterial = new THREE.MeshLambertMaterial(
                    {
                        color: (this.plane_constants.color+222)
                    });
        var finishLine = new THREE.Mesh(
            new THREE.PlaneGeometry(
                    this.plane_constants.width/4,
                    this.plane_constants.height,
                    this.plane_constants.quality,
                    this.plane_constants.quality),
            lineMaterial);
            
        this.scene.add(finishLine);
        finishLine.position.x = this.plane_constants.width/2 + this.plane_constants.width/8;

	this.ball = {};

	var selfSphereMaterial =
        new THREE.MeshLambertMaterial(
                 {
                     color: this.ball_values.self.color
                 });
	
	this.ball.self = new THREE.Mesh(
            new THREE.SphereGeometry(
                    this.ball_values.radius/10,
                    this.ball_values.segments,
                    this.ball_values.rings),
            selfSphereMaterial);

	this.scene.add(this.ball.self);

    	this.ball.self.position.x = this.ball_values.self.pos.x;
    	this.ball.self.position.y = this.ball_values.self.pos.y;
    	// set ball above the table surface
    	this.ball.self.position.z = this.ball_values.radius;
    	this.ball.self.rotation.z = this.ball_values.self.rotation;

	var otherSphereMaterial =
        new THREE.MeshLambertMaterial(
                 {
                     color: this.ball_values.other.color
                 });
	
	this.ball.other = new THREE.Mesh(
            new THREE.SphereGeometry(
                    this.ball_values.radius/10,
                    this.ball_values.segments,
                    this.ball_values.rings),
            otherSphereMaterial);

	this.scene.add(this.ball.other);

    	this.ball.other.position.x = this.ball_values.other.pos.x;
    	this.ball.other.position.y = this.ball_values.other.pos.y;
    	// set ball above the table surface
    	this.ball.other.position.z = this.ball_values.radius;
    	this.ball.other.rotation.z = this.ball_values.other.rotation;
        
        


        
        this.arrowMesh = {};
        
            var loader = new THREE.JSONLoader();
    loader.load('racer2.json', function (geometry) {
        this.arrowMesh.self = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xD43001
        }));

        this.arrowMesh.self.position.x = this.ball.self.position.x;
        this.arrowMesh.self.position.y = this.ball.self.position.y;
        this.arrowMesh.self.position.z = this.ball.self.position.z;
        this.arrowMesh.self.scale.x *= 10;
        this.arrowMesh.self.scale.y *= 10;
        this.arrowMesh.self.scale.z *= 10;
        this.arrowMesh.self.rotation.x = Math.PI/2;
        this.arrowMesh.self.rotation.y = 0;
        this.arrowMesh.self.rotation.z = 0;
        this.scene.add(this.arrowMesh.self);

    }.bind(this));
   
    
    var loader2 = new THREE.JSONLoader();
    loader2.load('mesh/racer2.json', function (geometry) {
        this.arrowMesh.other = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({
            color: 0xD43001
        }));

        this.arrowMesh.other.position.x = this.ball.other.position.x;
        this.arrowMesh.other.position.y = this.ball.other.position.y;
        this.arrowMesh.other.position.z = this.ball.other.position.z;
        this.arrowMesh.other.scale.x *= 10;
        this.arrowMesh.other.scale.y *= 10;
        this.arrowMesh.other.scale.z *= 10;
        this.arrowMesh.other.rotation.x = Math.PI/2;
        this.arrowMesh.other.rotation.y = 0;
        this.arrowMesh.other.rotation.z = 0;
        this.scene.add(this.arrowMesh.other);
    }.bind(this));  
    
    
   

    	var pointLight =
            	new THREE.PointLight(0xF8D898);

    	// set its position
    	pointLight.position.x = -1000;
    	pointLight.position.y = 0;
    	pointLight.position.z = 1000;
    	pointLight.intensity = 2.9;
    	pointLight.distance = 10000;
    	// add to the scene
    	this.scene.add(pointLight);

	this.makeWalls();
};

game_graphics.prototype.update_ball_color = function(own, colour){
    if (own){
        this.ball.self.material.color.setHex(colour);
        if (this.arrowMesh.self){
            this.arrowMesh.self.material.color.setHex(colour);
            return true;
        }
    }
    else{
        this.ball.other.material.color.setHex(colour);
        if (this.arrowMesh.other){
            this.arrowMesh.other.material.color.setHex(colour);
            return true;
        }
    }
    return false;
};

game_graphics.prototype.theCamera = function() {
    this.camera.position.x = this.ball.self.position.x - 100;
    this.camera.position.y += (this.ball.self.position.y - this.camera.position.y) * 0.05;
// this.camera.position.y =this.ball.self.position.y; //static camera
    this.camera.position.z = this.ball.self.position.z + 100;

    this.camera.rotation.x = -0.01 * (this.ball.self.position.y) * Math.PI / 180;
// this.camera.rotation.x = 0; //static camera
    this.camera.rotation.y = -60 * Math.PI / 180;
    this.camera.rotation.z = -90 * Math.PI / 180;
};

game_graphics.prototype.ballUpdate = function(selfBall, otherBall) {
	this.ball.self.position.x = selfBall.vis_pos.x;
	this.ball.self.position.y = selfBall.vis_pos.y;
	this.ball.self.rotation.z = selfBall.angle;
        
        
        
    if (this.arrowMesh.self){
            this.arrowMesh.self.position.x = selfBall.pos.x;
            this.arrowMesh.self.position.y = selfBall.pos.y;
            this.arrowMesh.self.rotation.y = selfBall.arrow.angle; 
    }
        this.ball.other.position.x = otherBall.pos.x;
	this.ball.other.position.y = otherBall.pos.y;
	this.ball.other.rotation.z = otherBall.angle;
        
    if (this.arrowMesh.other) {
            this.arrowMesh.other.position.x = otherBall.pos.x;
            this.arrowMesh.other.position.y = otherBall.pos.y;
            this.arrowMesh.other.rotation.y = otherBall.arrow.angle;
    }
};

game_graphics.prototype.makeWalls = function() {
    var verwall1, verwall2, horwall1, horwall2;
    var verwallwidth = 1;
    var verwallheight = this.plane_constants.height;
    var horwallwidth = this.plane_constants.width;
    var horwallheight = 1;
    var walldepth = this.obstacle_constants.wall_depth;

    var wallMaterial =
            new THREE.MeshLambertMaterial(
                    {
                        color: this.obstacle_constants.wall_color
                    });

    verwall1 = new THREE.Mesh(
            new THREE.CubeGeometry(
                    verwallwidth*10,
                    verwallheight,
                    walldepth,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality
                    ), wallMaterial);
    this.scene.add(verwall1);

    verwall2 = new THREE.Mesh(
            new THREE.CubeGeometry(
                    verwallwidth,
                    verwallheight,
                    walldepth,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality
                    ), wallMaterial);
    //this.scene.add(verwall2);

    horwall1 = new THREE.Mesh(
            new THREE.CubeGeometry(
                    horwallwidth-this.horWallMargin,
                    horwallheight*10,
                    walldepth,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality
                    ), wallMaterial);
    this.scene.add(horwall1);

    horwall2 = new THREE.Mesh(
            new THREE.CubeGeometry(
                    horwallwidth-this.horWallMargin,
                    horwallheight*10,
                    walldepth,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality,
                    this.obstacle_constants.obstacleQuality
                    ), wallMaterial);
    this.scene.add(horwall2);

    verwall1.position.z = walldepth / 4;
    verwall2.position.z = walldepth / 4;
    horwall1.position.z = walldepth / 4;
    horwall2.position.z = walldepth / 4;

    verwall1.position.x = -this.plane_constants.width / 2;
    verwall2.position.x = this.plane_constants.width / 2 - verwallwidth * 16;
    horwall1.position.x = -this.horWallMargin/2;
    horwall2.position.x = -this.horWallMargin/2;

    verwall1.position.y = 0;
    verwall2.position.y = 0;
    horwall1.position.y = -this.plane_constants.height / 2 - horwallheight * 4;
    horwall2.position.y = this.plane_constants.height / 2 + horwallheight * 4;


};

game_graphics.prototype.setObstacles=function(obstacles){
    var quality = 1;
    var depth = 10;
    var obs = [];
    var obstacleMaterial = 
                        new THREE.MeshLambertMaterial(
                    {
                        color: 0xFF4045
                    });
    for (var i=0;i<obstacles.length;i++){
        obs[i] = new THREE.Mesh(
            new THREE.CubeGeometry(
                    obstacles[i].width,
                    obstacles[i].height,
                    obstacles[i].depth,
                    quality,
                    quality,
                    quality),
            obstacleMaterial);
            this.scene.add(obs[i]);
            obs[i].receiveShadow = true;
            obs[i].castShadow = true;
            
            obs[i].position.x = obstacles[i].pos.x;
            obs[i].position.y = obstacles[i].pos.y;
            obs[i].position.z = depth;
    }
};

game_graphics.prototype.setObstaclesOwn = function(){
     var obstacleWidth =40, fieldWidth = 400,fieldHeight=200,     obstacleHeight = 10,
    obstacleDepth = 10;
        var quality = 1;
    var depth = 10;
    var obstacle = [{pos:{x:0,y:0}}];
       obstacle[0].width = obstacleWidth;
       obstacle[0].height = obstacleHeight;
       obstacle[0].depth = obstacleDepth;
       obstacle[0].ver_min = obstacle[0].bottom = obstacle[0].pos.y-obstacle[0].height/2;
       obstacle[0].ver_max = obstacle[0].top = obstacle[0].pos.y + obstacle[0].height/2;
       obstacle[0].hor_max = obstacle[0].right = obstacle[0].pos.x + obstacle[0].width/2;
       obstacle[0].hor_min = obstacle[0].left = obstacle[0].pos.x - obstacle[0].width/2;
       var obstacleMaterial = 
                        new THREE.MeshLambertMaterial(
                    {
                        color: 0xFF4045
                    });
       var obs = new THREE.Mesh(
            new THREE.CubeGeometry(
                    40,
                    10,
                    10,
                    quality,
                    quality,
                    quality),
            obstacleMaterial);
            this.scene.add(obs);
            obs.receiveShadow = true;
            obs.castShadow = true;
            
            obs.position.x = 0;
            obs.position.y = 0;
            obs.position.z = depth;
};
