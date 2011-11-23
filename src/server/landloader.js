var LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;

exports.LandLoader = function() {
  var self = this;
  
  self.getLand = function(landid) {
    var chunkWidth = 128;
    var scale = 5;
    var maxHeight = 100;   
    var minX = 0 - (chunkWidth);
    var minZ = 0 - (chunkWidth);
    var maxX = 0 + (chunkWidth);
    var maxZ = 0 + (chunkWidth);
    var chunks = [];

    for(var x = minX; x <= maxX ; x += chunkWidth) {
	    for(var z = minZ; z <= maxZ ; z += chunkWidth) {
		    var key = x + '_' + z;
        var width = chunkWidth + 1;
        var breadth = chunkWidth + 1;
              
        var chunk = getChunk(width, breadth, x, z, scale, maxHeight);
        chunks.push(chunk); 
	    }
    }

    return {
      scale: 5,
      chunkWidth: 128,
      min: [ minX, minZ ],
      max: [ maxX, maxZ ],
      shared: getChunk(width, breadth, 0, 0, scale, maxHeight),
      chunks: chunks
    };
  };

  var getChunk = function(width, breadth, x, z, scale, maxHeight) {
    var generator = new LandscapeGeneration(width, breadth, x, z, scale, maxHeight);
    return generator.create();
  };
}
