path = require('path');
fs = require('fs');
querystring = require('querystring');

var gl = require('./sylvester-common');

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

 	var width = parseInt(query.width);
	var height = parseInt(query.height);
	var maxHeight = parseInt(query.maxHeight);
	var scale = parseFloat(query.scale);	
	var startX = parseInt(query.startx);
	var startY = parseInt(query.starty);

	var heightMap = new Array(width * height);

	for(var x = 0; x < width ; x++){
		for(var y = 0; y < height; y++) {
			var terrainHeight = (Math.sin((x + startX) / 32) + Math.sin((y + startY) / 32));
			heightMap[x + (y * width)] = Math.min(1.0, (terrainHeight + 1.0) / 2);			
		}
	}    

	var indexCount = (height - 1) * width * 2;
	var vertices = new Array(width* height * 3);
    var vertexNormals = new Array(width * height);
	var texturecoords = new Array(width * height * 2);
	var colours = new Array(width * height * 4);
	var indices = new Array(indexCount);
   

	for(var y = 0 ; y < height ; y++ ) {
		for(var x = 0 ; x < width ; x++ ) {
			var index = (x + y * width);
    		vertexNormals[index] = gl.$V([0,0,0]);

			var vertexIndex = index * 3;
			var colourIndex = index * 4;
			var texcoordsIndex = index * 2;  
    		
        
        	    		
			vertices[vertexIndex] = startX + x;
			vertices[vertexIndex+1] = heightMap[index] * maxHeight;
			vertices[vertexIndex+2] = startY + y;

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
    var zeroVector = gl.$V([0,0,0]);
    while(i + 2 < indexCount) {      
        var iOne = indices[i];
        var iTwo = indices[i+1];
        var iThree = indices[i+2];

        var vOne = iOne * 3;
        var vTwo = iTwo * 3;
        var vThree = iThree * 3;
        
        var a = gl.$V([vertices[vOne], vertices[vOne+1], vertices[vOne+2]]);
        var b = gl.$V([vertices[vTwo], vertices[vTwo+1], vertices[vTwo+2]]);
        var c = gl.$V([vertices[vThree], vertices[vThree+1], vertices[vThree+2]]);
        
        var ab = b.subtract(a);
        var ac = c.subtract(a);
        var cross = ab.cross(ac);
        var normal = cross.toUnitVector();
        
        // Cos we're doing a indexed triangle strip, it goes odd/even/odd/even
        // But to make thing worse, because we double back on ourselves this flips every row
        // Rather than do complicated logic to sort this out, it's gonna be easier to just check the y direction
        // And invert the normal for the 'odd' faces
        if(normal.e(2) < 0){
            normal = zeroVector.subtract(normal);
        }
        
        
        // We add the face normal to all corresponding vertex normals
        vertexNormals[iOne] = vertexNormals[iOne].add(normal);
        vertexNormals[iTwo] = vertexNormals[iTwo].add(normal);
        vertexNormals[iThree] = vertexNormals[iThree].add(normal);
        
        i++;
    }
    
    // And now, finally we can calculate the vertex normals by normalising the contents
    // Of those arrays - we'll set colours at this point too, by calculating the dot product between
    // An imaginary scene light (always coming in from above and to the side) and the vertex normal
    
    
    var light = gl.$V([0, 0.8, 0.2]);
    for(var y = 0 ; y < height ; y++ ) {
        for(var x = 0 ; x < width ; x++ ) {
            var index = x + y * width;
            var colourIndex = index * 4;
            var normal = vertexNormals[index].toUnitVector();
            
            var shading = light.dot(normal);
            
         //   console.log(normal);
            colours[colourIndex++] = shading;
            colours[colourIndex++] = shading;       
            colours[colourIndex++] = shading;
            colours[colourIndex] = 1.0;
        }
    }   

	callback({
		vertices: vertices,
		colours: colours,
		indices: indices,
		texturecoords: texturecoords
	});
};
