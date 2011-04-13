var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var LandscapeController = function(app){
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
