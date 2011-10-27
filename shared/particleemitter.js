ParticleEmitter = function(id, capacity, app, config) {
    this.id = id;
    this.app = app;
    this.active = true;
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.colours = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    
    var config = config || {};    
    this.maxsize = config.maxsize || 20;
    this.maxlifetime = config.maxlifetime || 2.5;
    this.scatter = config.scatter || vec3.create([0.01,0.01,0.01]);
    
    this.track = config.track || function() {};
    this.time = 0;
    this.ticks = 0;
    this.rate = config.rate || 50;
            
    this.lifetimes = new Float32Array(capacity);
    this.creationTimes = new Float32Array(capacity);
    
    this.position =  config.position || vec3.create([0,0,0]);
    this.particleOutwardVelocity = config.particleOutwardVelocity || vec3.create([1,1,1]);
    this.particleTrajectoryVelocity = config.particleTrajectoryVelocity || vec3.create([0,0,0]);
        
    for(var x = 0 ; x < capacity; x++) {
        var vertex = x * 3;
        var colour = x * 3;
        
        this.positions[vertex] = 0;
        this.positions[vertex+1] = 0;
        this.positions[vertex+1] = 0;
      
        this.velocities[vertex] = this.particleTrajectoryVelocity[0] + (this.particleOutwardVelocity[0] - (Math.random() * this.particleOutwardVelocity[0] * 2)); 
        this.velocities[vertex+1] =  this.particleTrajectoryVelocity[1] + (this.particleOutwardVelocity[1] - (Math.random() * this.particleOutwardVelocity[1] * 2)); 
        this.velocities[vertex+2] = this.particleTrajectoryVelocity[2] + (this.particleOutwardVelocity[2] - (Math.random() * this.particleOutwardVelocity[2] * 2)); 
        
        this.colours[colour] = Math.random();
        this.colours[colour+1] = Math.random();
        this.colours[colour+2] = Math.random();
          
        this.sizes[x] = Math.random();
        this.creationTimes[x] = -1000;
        this.lifetimes[x] = Math.random() * this.maxlifetime;
    }
    
    this.createBuffers();
};

ParticleEmitter.prototype.start = function() {
  this.active = true;
};

ParticleEmitter.prototype.stop = function() {
  this.active = false;
};

ParticleEmitter.prototype.createBuffers = function(){
  var gl = this.app.context.gl;
  
  this.createConstantBuffers(gl);
  this.createVariableBuffers(gl); 

  this.texture = this.app.resources.getTexture('/data/textures/particle.png');
  
};

ParticleEmitter.prototype.createVariableBuffers = function(gl) {
    
    if(!this._vertexBuffer) {
        this._vertexBuffer = gl.createBuffer();
        this._creationTimesBuffer = gl.createBuffer();
    }

  gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);  
  gl.bindBuffer(gl.ARRAY_BUFFER, this._creationTimesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.creationTimes, gl.DYNAMIC_DRAW); 
};

ParticleEmitter.prototype.createConstantBuffers = function(gl){
    
  this._velocityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.velocities, gl.STATIC_DRAW);
  
  this._colourBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.STATIC_DRAW);
  
  this._sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.STATIC_DRAW);
  
  this._lifetimeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._lifetimeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.lifetimes, gl.STATIC_DRAW);

}

ParticleEmitter.prototype.getId = function() { return this.id; }

ParticleEmitter.prototype.doLogic = function() {
    this.time += 0.01;
    this.ticks++;

    if(!this.active) return;
        
    var lastPosition = vec3.create(this.position);
    var interpolation = vec3.create();
    this.track.call(this);
    
    vec3.subtract(this.position, lastPosition, interpolation);
    vec3.scale(interpolation, 1.0 / this.rate);
    
    if(!this.seeker) this.seeker = 0;
        
    // Search through and find any free particles
    var countFound = 0;
    for( ; this.seeker < this.capacity; this.seeker++){
        var x = this.seeker;
        var vertex = x * 3;
        var age = this.time - this.creationTimes[x];
        
        if(age > this.lifetimes[x]) {

            this.creationTimes[x] = this.time;
                    
            this.positions[vertex] = this.position[0] + countFound * interpolation[0];
            this.positions[vertex+1] = this.position[1] + countFound * interpolation[1];
            this.positions[vertex+2] = this.position[2] + countFound * interpolation[2];
            
            this.positions[vertex] += this.scatter[0] - (Math.random() * this.scatter[0] * 2);
            this.positions[vertex+1] += this.scatter[1] - (Math.random() * this.scatter[1] * 2);
            this.positions[vertex+2] += this.scatter[2] - (Math.random() * this.scatter[2] * 2);
            
            if(countFound++ == this.rate) { break; }            
        }
    }
    
    if(this.seeker == this.capacity) { this.seeker = 0; }
    
    if(countFound > 0){
       this.createVariableBuffers(this.app.context.gl);
    }
};

ParticleEmitter.prototype.setScene = function(scene) {
  this.scene = scene;
};

ParticleEmitter.prototype.render = function(context) {
    var gl = context.gl;
    
    var viewMatrix = this.scene.camera.getViewMatrix();
    var projectionMatrix = this.scene.camera.getProjectionMatrix(gl);
    
    var program = context.setActiveProgram("particles");
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVelocity'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVelocity'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColour'), 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColour'));    
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aSize'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aSize'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._creationTimesBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aCreationTime'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aCreationTime'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._lifetimeBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aLifetime'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aLifetime'));
    
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
    
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    
};

ParticleEmitter.prototype.is = function() { return false; };
exports.ParticleEmitter = ParticleEmitter;












