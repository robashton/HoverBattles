var blah = blah || {};

// Probably end up turning everything into entities and limiting the number of methods
// That entities need to actually implement in order to be added to a scene
blah.LandscapeController = function(scene) {
	this._scene = scene;
	this._chunks = {};
    this._counter = 0;
    
    var entity = new blah.Entity("terrain");
    var controller = this;
    
    entity.attach(function(){
        controller.doLogic();
    });
    
    entity.getHeightAt = function(x, z)
    {
        x /= blah.LandscapeController.Scale;
        z /= blah.LandscapeController.Scale;        
        
        var chunkWidth = blah.LandscapeController.ChunkWidth;
        var currentChunkX = parseInt(x / chunkWidth) * chunkWidth;
        var currentChunkZ = parseInt(z / chunkWidth) * chunkWidth;
        
        if(x < 0) { currentChunkX -= chunkWidth; }
        if(z < 0) { currentChunkZ -= chunkWidth; }
        
        var key = currentChunkX + '_' + currentChunkZ
        
        var chunk = controller._chunks[key];
        if(chunk){
            return chunk._model.getHeightAt(x, z);
        }
        else
        {
            console.log("chunk not found, setting height at 6");
            return 6;
        }
        
    };
    
    this._scene.addEntity(entity);
    
};

blah.LandscapeController.ChunkWidth = 128;
blah.LandscapeController.Scale = 5;

blah.LandscapeController.prototype.doLogic = function() {
    if(this._counter++ % 10 != 0) { return ; }
    
    var player = this._scene.getEntity("player");
        
	var chunkWidth = blah.LandscapeController.ChunkWidth;

	var currentx = this._scene.camera._location[0] / blah.LandscapeController.Scale;
	var currentz = this._scene.camera._location[2] / blah.LandscapeController.Scale;

	var currentChunkX = Math.floor(currentx / chunkWidth) * chunkWidth;
	var currentChunkZ = Math.floor(currentz / chunkWidth) * chunkWidth;

	// Remove dead chunks
	var minX = currentChunkX - (chunkWidth);
	var minZ = currentChunkZ - (chunkWidth);
	var maxX = currentChunkX + (chunkWidth);
	var maxZ = currentChunkZ + (chunkWidth);

	for(i in this._chunks){
		var chunk = this._chunks[i];
    	
        chunk._playerPosition = player.position;

		if(chunk.x < minX || chunk.z < minZ || chunk.x > maxX || chunk.z > maxZ) {
			// this._scene.removeEntity(chunk);
            //delete this._chunks[i];		
		}
    	
	}

	// And add missing chunks
	for(var x = minX; x <= maxX ; x += chunkWidth) {
		for(var z = minZ; z <= maxZ ; z += chunkWidth) {
			var key = x + '_' + z;
			if(this._chunks[key]) { continue; }
            console.log("Creating chunk " + key);

			var newChunkModel = new blah.LandChunk(chunkWidth + 1, chunkWidth + 1, 100, blah.LandscapeController.Scale, x, z);
			var newChunk = new blah.Entity('Chunk_' + key, newChunkModel);

			newChunk.x = x;
			newChunk.z = z;

			this._chunks[key] = newChunk;
			this._scene.addEntity(newChunk);			
		}
	}		
};
