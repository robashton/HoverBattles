path = require('path');
fs = require('fs');
querystring = require('querystring');

require('./matrixwrapper');

exports.handle = function(req, res) {
	generateData(req, res, function(model) {
		res.writeHead(200, "Content-Type: application/javascript");
		res.write(JSON.stringify(model));
		res.end();
	});
};

generateData = function(req, res, callback)
{
	var chunk = {};
	var query = querystring.parse(req.url);

    var maxHeight = parseInt(query.maxheight);
    var width = parseInt(query.width);
	var height = parseInt(query.height);
	var startX = parseInt(query.startx);
	var startY = parseInt(query.starty);
    var scale = parseInt(query.scale);
    
	var heightMap = new Array(width * height);

	for(var x = 0; x < width ; x++){
		for(var y = 0; y < height; y++) {
			var terrainHeight = (Math.sin((x + startX) / 32) + Math.sin((y + startY) / 32));
			heightMap[x + (y * width)] = Math.min(1.0, (terrainHeight + 1.0) / 2) * maxHeight;			
		}
	}
    
    var data = blah.generateTerrainData(width, height, maxHeight, scale, startX, startY, heightMap);

	callback({
		heights: heightMap,
    	colours: data.colours,
        vertices: data.vertices,
        indices: data.indices,
        texturecoords: data.texturecoords  
	});
};

var blah = blah || {};
blah.generateTerrainData = function(width, height, maxHeight, scale, startX, startY, heightMap) {
    
    var indexCount = (height - 1) * width * 2;
    var vertices = new Array(width* height * 3);
    var vertexNormals = new Array(width * height);
    var texturecoords = new Array(width * height * 2);
    var colours = new Array(width * height * 4);
    var indices = new Array(indexCount);
     
    for(var y = 0 ; y < height ; y++ ) {
        for(var x = 0 ; x < width ; x++ ) {
        	var index = (x + y * width);
    		vertexNormals[index] = vec3.create();
    
    		var vertexIndex = index * 3;
    		var colourIndex = index * 4;
    		var texcoordsIndex = index * 2;    
        	    		
    		vertices[vertexIndex] = (startX + x) * scale;
    		vertices[vertexIndex+1] = heightMap[index];
    		vertices[vertexIndex+2] = (startY + y) * scale;
    
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
    
    /*
    AB=B-A;
    AC=C-A;
    N=normalize(AB cross AC); */
    
    // Now calculate the face normals
    i = 0;
    var zeroVector = vec3.create([0,0,0]);
    while(i + 2 < indexCount) {      
        var iOne = indices[i];
        var iTwo = indices[i+1];
        var iThree = indices[i+2];
    
        var vOne = iOne * 3;
        var vTwo = iTwo * 3;
        var vThree = iThree * 3;
        
        var a = vec3.create([vertices[vOne], vertices[vOne+1], vertices[vOne+2]]);
        var b = vec3.create([vertices[vTwo], vertices[vTwo+1], vertices[vTwo+2]]);
        var c = vec3.create([vertices[vThree], vertices[vThree+1], vertices[vThree+2]]);
        
        var ab = vec3.create();
        var ac = vec3.create();
        var cross = vec3.create();
        var normal = vec3.create();
        
        vec3.subtract(a, b, ab);
        vec3.subtract(a, c, ac);
        vec3.cross(ac, ab, cross);
        vec3.normalize(cross, normal);
        
        // Cos we're doing a indexed triangle strip, it goes odd/even/odd/even
        // But to make thing worse, because we double back on ourselves this flips every row
        // Rather than do complicated logic to sort this out, it's gonna be easier to just check the y direction
        // And invert the normal for the 'odd' faces
        if(normal[1] < 0){
            vec3.subtract(zeroVector, normal, zeroVector);
        }     
        
        // We add the face normal to all corresponding vertex normals
        vec3.add(vertexNormals[iOne], normal);
        vec3.add(vertexNormals[iTwo], normal);
        vec3.add(vertexNormals[iThree], normal);
        
        i++;
    }
    
    // And now, finally we can calculate the vertex normals by normalising the contents
    // Of those arrays - we'll set colours at this point too, by calculating the dot product between
    // An imaginary scene light (always coming in from above and to the side) and the vertex normal
    
    
    var light = vec3.create([0, 0.8, 0.2]);
    for(var y = 0 ; y < height ; y++ ) {
        for(var x = 0 ; x < width ; x++ ) {
            var index = x + y * width;
            var colourIndex = index * 4;
            var normal = vec3.create();
            vec3.normalize(vertexNormals[index], normal);
            
            var shading = 1.0; // vec3.dot(light, normal);
            
            //   console.log(normal);
            colours[colourIndex++] = shading;
            colours[colourIndex++] = shading;       
            colours[colourIndex++] = shading;
            colours[colourIndex] = 1.0;
        }
    }
    return {
      colours: colours,
      vertices: vertices,
      indices: indices,
      texturecoords: texturecoords     
    };
};
