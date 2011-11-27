var LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;

exports.LandLoader = function() {
  var self = this;

  var chunkWidth = 128;
  var scale = 5;
  var maxHeight = 100;   
  var minX = 0 - (chunkWidth);
  var minZ = 0 - (chunkWidth);
  var maxX = 0 + (chunkWidth);
  var maxZ = 0 + (chunkWidth);
  var width = chunkWidth + 1;
  var breadth = chunkWidth + 1;

  var generator = new LandscapeGeneration(minX, minZ, maxX + chunkWidth, maxZ + chunkWidth, scale, maxHeight);
  
  self.getLand = function(landid) {

    var chunks = [];
    for(var x = minX; x <= maxX ; x += chunkWidth) {
	    for(var z = minZ; z <= maxZ ; z += chunkWidth) {
		    var key = x + '_' + z;
        var chunk = getChunk(x, z, width, breadth);
        chunks.push(chunk); 
	    }
    }

    return {
      scale: scale,
      chunkWidth: chunkWidth,
      vertexWidth: width,
      min: [ minX, minZ ],
      max: [ maxX, maxZ ],
      shared: getSharedChunkData(),
      chunks: chunks
    };
  };

  var getSharedChunkData = function() {
    return generator.generateSharedRenderingInfo(width, breadth);
  };

  var getChunk = function(x, z, width, breadth) {
    return generator.generateChunk(x, z, width, breadth);
  };
}
