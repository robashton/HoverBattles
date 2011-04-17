ParticleEmitter = function(id, capacity, app) {
    this.id = id;
    this.app = app;
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.colours = new Float32Array(capacity * 4);
    this.sizes = new Float32Array(capacity);
    this.maxsize = 10;
    this.time = 0;
        
    for(var x = 0 ; x < capacity; x++) {
        var vertex = x * 3;
        var colour = x * 4;
        this.positions[vertex] = 0;
        this.positions[vertex+1] = 0;
        this.positions[vertex+1] = 0;
        
        this.velocities[vertex] = Math.random() * 2 - 1;
        this.velocities[vertex+1] = Math.random() * 2 - 1;
        this.velocities[vertex+2] = Math.random() * 2 - 1;
        
        this.colours[colour] = Math.random();
        this.colours[colour+1] = Math.random();
        this.colours[colour+2] = Math.random();
        this.colours[colour+3] = 1.0;
        
        this.sizes[x] = Math.random();
    }
    
    this.createBuffers();
};

ParticleEmitter.prototype.createBuffers = function(){
  var gl = this.app.context.gl;
  
  this._vertexBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.STATIC_DRAW);
  
  this._velocityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.velocities, gl.STATIC_DRAW);
  
  this._colourBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.STATIC_DRAW);
  
  this._sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.STATIC_DRAW);

  this.texture = this.app.resources.getTexture('/textures/particle.png');
  
};

ParticleEmitter.prototype.getId = function() { return this.id; }

ParticleEmitter.prototype.doLogic = function() {
    this.time += 0.01;
};

ParticleEmitter.prototype.setScene = function(scene) {
  this.scene = scene;  
};

ParticleEmitter.prototype.render = function(context) {
    var gl = context.gl;
    
    var viewMatrix = this.scene.camera.getViewMatrix();
	var projectionMatrix = this.scene.camera.getProjectionMatrix(gl);
    
    var program = context.setActiveProgram("particles");
    
    gl.enable(gl.VERTEX_PROGRAM_POINT_SIZE);
    gl.enable(gl.POINT_SMOOTH);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVelocity'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVelocity'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColour'), 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColour'));    
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aSize'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aSize'));
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0)
    

    var camera = this.scene.camera.location;
    gl.uniform3f(gl.getUniformLocation(program, 'vCamera'), camera[0], camera[1], camera[2] );
    gl.uniform1f(gl.getUniformLocation(program, 'time'), this.time);
    gl.uniform1f(gl.getUniformLocation(program, 'maxsize'), this.maxsize);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
        
    var gl = context.gl;
	gl.drawArrays(gl.POINTS, 0, this.capacity);
    
};


exports.ParticleEmitter = ParticleEmitter;












