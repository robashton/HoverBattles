
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var module = cache[name], path = expand(root, name), fn;
      if (module) {
        return module;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: name, exports: {}};
        try {
          cache[name] = module.exports;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return cache[name] = module.exports;
        } catch (err) {
          delete cache[name];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"camera": function(exports, require, module) {var Camera = function(location){
    this.location = location || vec3.create();
    this.lookAt = vec3.create();
    this.up = vec3.create([0,1,0]);
};


Camera.prototype.setLocation = function(location){
	this.location = location;
};

Camera.prototype.getProjectionMatrix = function(gl) {
	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);
	return projectionMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    var viewMatrix = mat4.create();
    mat4.lookAt(this.location, this.lookAt, this.up, viewMatrix);
	return viewMatrix;	
};

exports.Camera = Camera;}, "chasecamera": function(exports, require, module) {var ChaseCamera = {
  doLogic: function(){      
      var terrain = this._scene.getEntity("terrain");
      
     this._scene.camera.lookAt = this.position;
     
     var cameraTrail = vec3.create(this._velocity);
     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 50);
     vec3.subtract(this.position, cameraTrail, cameraTrail);
     this._scene.camera.location = cameraTrail;
     
     var terrainHeightAtCameraLocation = terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.position[1] + 15);
     
     this._scene.camera.location[1] =  cameraHeight;
  }    
};

exports.ChaseCamera = ChaseCamera;}, "clipping": function(exports, require, module) {var Clipping = {
  setBounds: function(min, max){
    this._min = min;
    this._max = max;
  },
  
  doLogic: function(){
    for(var i = 0 ; i < 3 ; i++){
        if(this.position[i] < this._min[i]) {
            this.position[i] = this._min[i];
            this._velocity[i] = 0; //-this._velocity[i];
        }
        else if(this.position[i] > this._max[i]) {
            this.position[i] = this._max[i];
            this._velocity[i] = 0; //-this._velocity[i];    
        }
    }
  }
    
};

exports.Clipping = Clipping;}, "controller": function(exports, require, module) {var Controller = function(scene) {
  this.scene = scene;
  this._timeAtLastFrame = new Date().getTime();
  this._idealTimePerFrame = 1000 / 30;
  this._leftover = 0.0;
  this._first = true;
};

Controller.prototype.tick = function(){
    var timeAtThisFrame = new Date().getTime();
    var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
    if(this._first) { catchUpFrameCount = 1; timeSinceLastDoLogic = this._idealTimePerFrame; this._first = false; }
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this.scene.doLogic();
	}
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;  
};

exports.Controller = Controller;}, "defaultmodelloader": function(exports, require, module) {var DefaultModelLoader = function(resources){
    this._resources = resources;
};

DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 3);
    var loader = this;
    LazyLoad.js('/models/' + path, function () {
        model.setData({
             vertices: BlenderExport[name].vertices,
             indices: BlenderExport[name].indices,
             texCoords: BlenderExport[name].texCoords,
             normals: BlenderExport[name].normals,
             texture: loader._resources.getTexture("/textures/" + name + ".jpg")
         });
         callback();
    });
    
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;}, "defaulttextureloader": function(exports, require, module) {var DefaultTextureLoader = function(app){
    this._app = app;  
};

DefaultTextureLoader.prototype.load = function(path, callback) {

  var image = new Image();
  image.onload = function(){
    callback();  
  };
  
  image.src = path;
  var texture = new Texture(path, image);
  return texture; 
};

exports.DefaultTextureLoader = DefaultTextureLoader;}, "entity": function(exports, require, module) {var Entity = function(id){
    this._model = null;
	this._id = id;
	this.position = vec3.create();
    this.rotationY = 0;
	this._scene = null;
};

Entity.prototype.getId = function(){
	return this._id;
};

Entity.prototype.setModel = function(model) {
   this._model = model;  
};

Entity.prototype.getModel = function(){
	return this._model;
};

Entity.prototype.attach = function(component) {
    for(i in component){
        if(i == "doLogic"){
            var newLogic = component[i];
            var oldLogic = this.doLogic;
            this.doLogic = function(){
              oldLogic.call(this);
              newLogic.call(this);
            };
        }
        else {
            this[i] = component[i]; 
        }
    }
};

Entity.prototype.doLogic = function() { };

Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};

Entity.prototype.render = function(context){
    if(!this._model) { return; }
	var gl = context.gl;

	var viewMatrix = this._scene.camera.getViewMatrix();
	var projectionMatrix = this._scene.camera.getProjectionMatrix(gl);
    
	var worldMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.translate(worldMatrix, this.position);
    mat4.rotateY(worldMatrix, this.rotationY);
    
    var modelViewMatrix = mat4.create();
    mat4.multiply(worldMatrix,viewMatrix, modelViewMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(worldMatrix, normalMatrix);
    mat3.transpose(normalMatrix);

	var program = context.setActiveProgram(this._model.getProgram());
    
	this._model.upload(context);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormal"), false, normalMatrix);

	this._model.render(context);
};

exports.Entity = Entity;
}, "hovercraft": function(exports, require, module) {var Hovercraft = {
    _velocity: vec3.create([0.01,0,0.01]),
    _decay: 0.97,
    impulseForward: function(amount) {
        var accelerationZ = (-amount) * Math.cos(this.rotationY);
        var accelerationX = (-amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseBackward: function(amount) {
        var accelerationZ = (amount) * Math.cos(this.rotationY);
        var accelerationX = (amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseLeft: function(amount) {
        this.rotationY += amount;
    },
    impulseRight: function(amount) {
        this.rotationY -= amount;
    },
    impulseUp: function(amount) {
        var terrain = this._scene.getEntity("terrain");
        
        var terrainHeight = terrain.getHeightAt(this.position[0], this.position[2]);
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 20.0) {
            this._velocity[1] += amount;
        }
    },
    doLogic: function() {
        var terrain = this._scene.getEntity("terrain");
        vec3.add(this.position, this._velocity);
                     
        var terrainHeight =  terrain.getHeightAt(this.position[0], this.position[2]);  
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 0) {
            this.position[1] = terrainHeight;   
        }
         
         if(heightDelta < 10.0){
               this._velocity[1] += (10.0 - heightDelta) * 0.08;
         }
         this._velocity[1] -= 0.07;              
         vec3.scale(this._velocity, this._decay);    
         
    }
}
         
exports.Hovercraft = Hovercraft;
         

}, "hovercraftcontroller": function(exports, require, module) {var KeyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

var HovercraftController = {
    doLogic: function(){        
        if(KeyboardStates[KeyCodes.W]) {
		    this.impulseForward(0.2);
    	} 
        else if(KeyboardStates[KeyCodes.S]) {
        	this.impulseBackward(0.1);
    	}    
    	if(KeyboardStates[KeyCodes.D]) {
        	this.impulseRight(0.05);
    	}
        else if(KeyboardStates[KeyCodes.A]) {
            this.impulseLeft(0.05);
    	}
        if(KeyboardStates[KeyCodes.Space]) {
            this.impulseUp(1.0);
        }
    }
};

exports.HovercraftControllre = HovercraftController;
exports.KeyCodes = KeyCodes;}, "hovercraftfactory": function(exports, require, module) {var Entity = require('entity').Entity;

var HovercraftFactory = function(app){
  this._app = app;  
};

HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.js");
  var entity = new Entity(id);
  entity.setModel(model);
  //entity.attach(Clipping);
  entity.attach(Hovercraft);
  
  //entity.setBounds([-1000,-1000, -1000], [1000,1000,1000]);
  return entity;
};

exports.HovercraftFactory = HovercraftFactory;}, "keyboard": function(exports, require, module) {var KeyboardStates = {};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.KeyboardStates = KeyboardStates;}, "landchunk": function(exports, require, module) {var LandChunk = function(width, height, maxHeight, scale,x,y){
    this._maxHeight = maxHeight;
	this._width = width;
	this._height = height;
	this._x = x;
	this._y = y;
    this._scale = scale;

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._indexCount = 0;
	this._colourBuffer = null;
	this._texturecoordsBuffer = null;
	
	this._texture = null;
    this._detailtexture = null;
    this._hovertexture = null;
    this._data = null;
    
    this._frame = 0.0;
    this._playerPosition = vec3.create();
};

LandChunk.prototype.getProgram = function(){
    return "landscape";
};

LandChunk.prototype.loadTextures = function(resources) {
    this._texture = resources.getTexture("/textures/gridlow.jpg");
    this._detailtexture = resources.getTexture("/textures/gridhigh.jpg");
    this._hovertexture = resources.getTexture("/textures/bars.jpg");
};

LandChunk.prototype.setData = function(data) {
    this._data = data;
};

LandChunk.prototype.activate = function(context) {
    var gl = context.gl;
  	 
	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.vertices), gl.STATIC_DRAW)

	this._colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.colours), gl.STATIC_DRAW)
	
	this._texturecoordsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.texturecoords), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._data.indices), gl.STATIC_DRAW);

	this._indexCount = this._data.indices.length;    	
};

LandChunk.prototype.upload = function(context) {
    var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
			
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	
    gl.uniform1f(gl.getUniformLocation(program, 'time'), this._frame);         
    gl.uniform3f(gl.getUniformLocation(program, 'uPlayerPosition'), this._playerPosition[0], this._playerPosition[1], this._playerPosition[2]);
	
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
	gl.uniform1i(gl.getUniformLocation(program, 'uDiffuseSampler'), 0); 
	
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._detailtexture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uDetailSampler'), 1); 
    
    gl.activeTexture(gl.TEXTURE2);
    gl.bindTexture(gl.TEXTURE_2D, this._hovertexture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uHoverSampler'), 2); 

};

LandChunk.prototype.render = function(context) {
    this._frame++;
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
};

LandChunk.prototype.getHeightAt = function(x, z) {
    if(!this._data) {
        return 6;
    }
    
    var heightmap = this._data.heights;
    
    // Transform to values we can (almost) index our array with
    var transformedX = x - this._x;
    var transformedZ = z - this._y;
    
    var baseX = Math.floor(transformedX);
    var baseZ = Math.floor(transformedZ);

    var horizontalWeight = transformedX - baseX;
    var verticalWeight = transformedZ - baseZ; 
    
    var leftX = baseX;
    var rightX = baseX + 1;
    var topX = baseZ; 
    var bottomX = baseZ + 1;
        
    var topLeft = heightmap[leftX + topX * this._width];
    var topRight = heightmap[rightX + topX * this._width];
    var bottomLeft = heightmap[leftX + bottomX * this._width];
    var bottomRight = heightmap[rightX + bottomX * this._width];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top;
};

exports.LandChunk = LandChunk;
}, "landchunkloader": function(exports, require, module) {var LandChunkModelLoader = function(resources){
    this._resources = resources;
};

LandChunkModelLoader.prototype.handles = function(path){
  return path.indexOf('chunk_') > -1;
};

LandChunkModelLoader.prototype.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
    
    var url = '/Landscape&height=' + (data.height) +
	'&width=' + (data.width) + 
	'&maxheight=' + data.maxHeight + 
	'&scale=' + data.scale +
	'&startx=' + data.x + 
	'&starty=' + data.y;
    
    var model = new LandChunk(data.height, data.width, data.maxHeight, data.scale, data.x, data.y);
    model.loadTextures(this._resources);
    
    var loader = this;
    LazyLoad.js(url, function () {
        var data = blah.Land[url];
        model.setData(data);
        callback();
    });
    
    return model;
};

exports.LandChunkModelLoader = LandChunkModelLoader;}, "landscapecontroller": function(exports, require, module) {var LandscapeController = function(app){
  app.resources.addModelLoader(
        new LandChunkModelLoader(app.resources)
        );
  app.scene.addEntity(this);
  
  this.app = app;
  this._chunks = {};
  this._counter = 0;
  this._chunkWidth = 128;
  this._scale = 5;
};

LandscapeController.prototype.getId = function() {
  return "terrain";  
};

LandscapeController.prototype.getHeightAt = function(x, z) {
    x /= this._scale;
    z /= this._scale;        
    
    var currentChunkX = parseInt(x / this._chunkWidth) * this._chunkWidth;
    var currentChunkZ = parseInt(z / this._chunkWidth) * this._chunkWidth;
    
    if(x < 0) { currentChunkX -= this._chunkWidth; }
    if(z < 0) { currentChunkZ -= this._chunkWidth; }
    
    var key = currentChunkX + '_' + currentChunkZ
    
    var chunk = this._chunks[key];
    if(chunk)
    {
        return chunk.getHeightAt(x, z);
    }
    else
    {
        return 20; // FTW
    }    
};

LandscapeController.prototype.doLogic = function(){
    if(this._counter++ % 10 != 0) { return ; }
    
    var app = this.app,
    scene = this.app.scene;
    
    var player = scene.getEntity("player");
        
    var currentx = scene.camera.location[0] / this._scale;
	var currentz = scene.camera.location[2] / this._scale;

	var currentChunkX = Math.floor(currentx / this._chunkWidth) * this._chunkWidth;
	var currentChunkZ = Math.floor(currentz / this._chunkWidth) * this._chunkWidth;

	// Remove dead chunks
	var minX = currentChunkX - (this._chunkWidth);
	var minZ = currentChunkZ - (this._chunkWidth);
	var maxX = currentChunkX + (this._chunkWidth);
	var maxZ = currentChunkZ + (this._chunkWidth);

	for(i in this._chunks){
		var chunk = this._chunks[i];
    	
        // chunk._model._playerPosition = player.position;

		if(chunk.x < minX || chunk.z < minZ || chunk.x > maxX || chunk.z > maxZ) {
			//this._scene.removeEntity(chunk);
            //delete this._chunks[i];		
		}    	
	}

	for(var x = minX; x <= maxX ; x += this._chunkWidth) {
		for(var z = minZ; z <= maxZ ; z += this._chunkWidth) {
			var key = x + '_' + z;
			if(this._chunks[key]) { continue; }
            
            var data = 'chunk_' + JSON.stringify({
               height: this._chunkWidth + 1,
               width: this._chunkWidth + 1,
               maxHeight: 100,
               scale: this._scale,
               x: x,
               y: z               
            })

            var model = app.resources.getModel(data);
			var chunkEntity = new Entity('Chunk_' + key);
            chunkEntity.setModel(model);
            chunkEntity.attach(LandChunkEntity);
			chunkEntity.x = x;
			chunkEntity.z = z;

			this._chunks[key] = chunkEntity;
			this.app.scene.addEntity(chunkEntity);			
		}
	}
};

LandChunkEntity = {
  getHeightAt: function(x,z){
   return this._model.getHeightAt(x,z);   
  }
};

// Interface segregation, I rather suspect I should do something about this in scene
LandscapeController.prototype.setScene = function(scene){};
LandscapeController.prototype.render = function(context){};

exports.LandscapeController = LandscapeController;
}, "model": function(exports, require, module) {var Model = function(data){
    this._programName = "default";
        
    if(data) { this.setData(data); }
	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;

    this._hasData = false;
};

Model.prototype.setData = function(data) {
    this._vertices = data.vertices;
    this._colours = data.colours;
	this._indices = data.indices;
    this._texCoords = data.texCoords;
    this._normals = data.normals;
    this._texture = data.texture;
    this._hasData = true;
    if(this._texCoords) { this._programName = "texture"; }
    else if( this._colours ) { this._programName = "colour"; }
};

Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.activate = function(context) {
	var gl = context.gl;

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW)

	if(this._colours) {
		this._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colours), gl.STATIC_DRAW)
	}
    if(this._texCoords) {
        this._textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._texCoords), gl.STATIC_DRAW)
    }
    
    if(this._normals) {
        this._normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW)
    }

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

};

Model.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);

	if(this._colourBuffer) {
		gl.deleteBuffer(this._colourBuffer);
	}    
    if(this._textureBuffer) {
    	gl.deleteBuffer(this._textureBuffer);
    }  
    if(this._texture) {
        gl.deleteTexture(this._texture);
    }
    if(this._normalBuffer) {
        gl.deleteBuffer(this._normalBuffer);
    }

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;
};


Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.upload = function(context) {
	var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	if(this._colourBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
	}
    
    if(this._textureBuffer) {
    	gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
    	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
    	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
    }    
    
    if(this._normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aNormals'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aNormals'));
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    
    if(this._texture){
       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
       gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);      
    }
};

Model.prototype.render = function(context) {
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLES, this._indices.length , gl.UNSIGNED_SHORT, 0);
};

Model.Quad = function()
{
	return new Model({
				vertices: [			
				0.0, 0.0, 0, 
				1.0, 0.0, 0, 
				1.0, 1.0, 0, 
				0.0, 1.0, 0
				],
    			texCoords: [
        		    0.0, 0.0,
            	    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0
            	 ],
				indices: [0, 1, 2, 0, 2, 3]
			},
			"default"
		);
};

exports.Model = Model;

}, "rendercontext": function(exports, require, module) {
var RenderContext = function(resourceLoader){
    this.gl = null;
	this.programs = {};
};

RenderContext.prototype.init = function(selector) {
  var canvas =  document.getElementById(selector);

  this.gl = canvas.getContext("experimental-webgl");

  this.gl.viewportWidth = canvas.width;
  this.gl.viewportHeight = canvas.height;  

  this.gl.clearColor(0.0, 0.5, 0.5, 1.0);
  this.gl.enable(this.gl.DEPTH_TEST);  
};

RenderContext.prototype.createProgram = function(programName) {
	
	var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
	
   this.gl.shaderSource(fragmentShader, blah.Shaders[programName].Fragment);
   this.gl.compileShader(fragmentShader);

   this.gl.shaderSource(vertexShader, blah.Shaders[programName].Shader);
   this.gl.compileShader(vertexShader);

	if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(vertexShader);
	}
	if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(fragmentShader);
	}

   var program = this.gl.createProgram();
	this.gl.attachShader(program, vertexShader);
   this.gl.attachShader(program, fragmentShader);
   this.gl.linkProgram(program);	

	if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
		throw "Couldn't create program";
	}	

	this.programs[programName] = program;
};


RenderContext.prototype.setActiveProgram = function(programName) {
	if(!this.programs[programName]) { this.createProgram(programName); }
	var program = this.programs[programName];

	this.gl.useProgram(program);
	this.program = program;
	return program;
}; 

exports.RenderContext = RenderContext;

}, "resources": function(exports, require, module) {var DefaultModelLoader = require('defaultmodelloader').DefaultModelLoader;
var DefaultTextureLoader = require('defaulttextureloader').DefaultTextureLoader;


var ResourceManager = function(app){
    this._app = app;
    this._modelLoaders = [];
    
    this._textureLoader = new DefaultTextureLoader(app);
    this._modelLoaders.push( new DefaultModelLoader(this) );
    
    this._textures = {};
    this._models = {};
    
    this._pendingTextureCount = 0;
    this._pendingModelCount = 0;
};

ResourceManager.prototype.getTexture = function(path){
    if(this._textures[path]) return this._textures[path];   
    
    var resources = this;
    resources._pendingTextureCount++;
    var texture = this._textureLoader.load(path, function(){
            resources._pendingTextureCount--;
            resources.registerForActivation(texture);
        });

    this._textures[path] = texture;
    return texture;    
};

ResourceManager.prototype.onAllAssetsLoaded = function(callback){
    var resources = this;
    var intervalId = setInterval(function(){      
      if( resources._pendingTextureCount == 0 &&
          resources._pendingModelCount == 0)
      {          
        clearInterval(intervalId);
        callback();
      }      
  }, 100);
    
};

ResourceManager.prototype.addModelLoader = function(loader) {
  this._modelLoaders.push(loader);  
};

ResourceManager.prototype.registerForActivation = function(resource) {
  resource.activate(this._app.context);
};

ResourceManager.prototype.getModel = function(path) {
    if(this._models[path]) return this._models[path];
    var resources = this;
    for(i in this._modelLoaders){
        var loader = this._modelLoaders[i];
        if(loader.handles(path)){
            resources._pendingModelCount++;
            var model = loader.load(path, function() {
                  resources._pendingModelCount--;
                  resources.registerForActivation(model);  
                });
            this._models[path] = model;
            return model;
        }
    }
};

exports.ResourceManager = ResourceManager;}, "scene": function(exports, require, module) {var Camera = require('camera').Camera;

var Scene = function(){
    this._entities = {};
    this.camera = new Camera();
};

Scene.prototype.getEntity = function(id) {
  return this._entities[id];  
};

Scene.prototype.addEntity = function(entity){
    this._entities[entity.getId()] = entity;
	entity.setScene(this);
};

Scene.prototype.removeEntity = function(entity) {
	entity.setScene(undefined);
	delete this._entities[entity.getId()];
};

Scene.prototype.doLogic = function() {
    for(i in this._entities){
        this._entities[i].doLogic();
    }
};

Scene.prototype.render = function(context){
    var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for(var i in this._entities) {
		var entity = this._entities[i];
		entity.render(context);
	}  
};

exports.Scene = Scene;}, "texture": function(exports, require, module) {var Texture = function(name, image){
    this._data = null;
    this._image = image;
    this._name = name;
};

Texture.prototype.get = function(){
    return this._data;
};

Texture.prototype.activate = function(context) {
    var gl = context.gl;
    var data = gl.createTexture();
    this._data = data;
    
    data.image = this._image;
    gl.bindTexture(gl.TEXTURE_2D, data);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.bindTexture(gl.TEXTURE_2D, null);
};

exports.Texture = Texture;}});
