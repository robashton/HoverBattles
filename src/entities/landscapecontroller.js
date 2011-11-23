var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Entity = require('../core/entity').Entity;


exports.LandscapeController = function(app){
  var self = this;

  var chunks = {};
  var counter = 0;
  var chunkWidth = 128;
  var scale = 5;

  loadChunks = function(){
    var scene = app.scene;
          
	  var minX = 0 - (chunkWidth);
	  var minZ = 0 - (chunkWidth);
	  var maxX = 0 + (chunkWidth);
	  var maxZ = 0 + (chunkWidth);

	  for(var x = minX; x <= maxX ; x += chunkWidth) {
		  for(var z = minZ; z <= maxZ ; z += chunkWidth) {
			  var key = x + '_' + z;
			  if(chunks[key]) { continue; }
              
        var data = 'chunk_' + JSON.stringify({
           height: chunkWidth + 1,
           width: chunkWidth + 1,
           maxHeight: 100,
           scale: scale,
           x: x,
           y: z               
        });

        createChunkFromData(x, z, data, key);
		  }
	  }
  };

  var createChunkFromData = function(x, z, data, key) {
    var model = app.resources.getModel(data);
	  var chunkEntity = new Entity('Chunk_' + key);

    chunkEntity.setModel(model);
    chunkEntity.attach(LandChunkEntity);
	  chunkEntity.position = vec3.create([x * scale, 0, z * scale]);

	  chunks[key] = chunkEntity;
	  app.scene.addEntity(chunkEntity);	
  };
  
  self.getId = function() {
    return "terrain";  
  };

  self.getHeightAt = function(x, z) {
    x /= scale;
    z /= scale; 
    var key = extractKeyFromRealWorldPosition(x, z);      
    var chunk = chunks[key];
    if(chunk)
        return chunk.getHeightAt(x, z);
    else
        return -100;
  };

  var extractKeyFromRealWorldPosition = function(x, z) {
    
    var currentChunkX = parseInt(x / chunkWidth) * chunkWidth;
    var currentChunkZ = parseInt(z / chunkWidth) * chunkWidth;
    
    if(x < 0) { currentChunkX -= chunkWidth; }
    if(z < 0) { currentChunkZ -= chunkWidth; }
    
    return currentChunkX + '_' + currentChunkZ;
  };

  self.doLogic = function() {};
  self.setScene = function(scene){};
  self.render = function(context){};
  self.is = function(){ return false; };
  self.addEventHandler = function() { };
  self.removeEventHandler = function() {};

  loadChunks();
  app.scene.addEntity(this);
};

var LandChunkEntity = function() {
  var self = this;

  self.getHeightAt = function(x,z){
   return self._model.getHeightAt(x,z);   
  }
};



