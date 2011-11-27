exports.LandscapeGeneration = function(minX, minZ, maxX, maxZ, scale, maxHeight) {
  var self = this;

  self.generateChunk = function(startX, startY, width, breadth) {
    var heightMap = new Array(width * breadth);

    for(var x = 0; x < width ; x++){
		  for(var y = 0; y < breadth; y++) {
        var realX = x + startX;
        var realY = y + startY;
      
			  var terrainHeight = (Math.sin((x + startX) / 32) + Math.sin((y + startY) / 32));
        terrainHeight = Math.min(1.0, (terrainHeight + 1.0) / 2) * maxHeight;		

        if(realX === minX || realX === maxX || realY === minZ || realY === maxZ)
          terrainHeight -= 10;

			  heightMap[x + (y * width)] = terrainHeight;	
		  }
	  }
    return {
		  heights: heightMap,
      x: startX * scale,
      y: startY * scale
    };
  };

  self.generateSharedRenderingInfo = function(width, height) {
  
    var indexCount = (height - 1) * width * 2;
    var vertices = new Array(width* height * 2);
    var texturecoords = new Array(width * height * 2);
    var indices = new Array(indexCount);
     
    for(var y = 0 ; y < height ; y++ ) {
      for(var x = 0 ; x < width ; x++ ) {
      	var index = (x + y * width);
  
    		var vertexIndex = index * 2;
    		var texcoordsIndex = index * 2;    
        	    		
    		vertices[vertexIndex] = (x) * scale;
    		vertices[vertexIndex+1] = (y) * scale;
    
    		texturecoords[texcoordsIndex] = x / width;
    		texturecoords[texcoordsIndex+1] = y / height;
    	}
    }
    
    var topRowIndex = 0;
    var bottomRowIndex = width;
    
    var goingRight = true;
    var i = 0;
    
    // Trying to do an indexed triangle strip...
    // We go right until we reach the end of a row
    // And then come back again on the next row
    // And repeat until we run out of vertices
    while(i < indexCount)
    {
    	if(goingRight) {
    		indices[i++] = topRowIndex++;
    		indices[i++] = bottomRowIndex++;
    		
    		if(topRowIndex % width == 0){
    			goingRight = false;
    			topRowIndex = bottomRowIndex-1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	} else {
    		indices[i++] = topRowIndex--;
    		indices[i++] = bottomRowIndex--;
    
    		if((topRowIndex+1) % width == 0){
    			goingRight = true;
    			topRowIndex = bottomRowIndex+1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	}
    }	

    return {
      vertices: vertices,
      indices: indices,
      texturecoords: texturecoords     
    };
  }; 
};
