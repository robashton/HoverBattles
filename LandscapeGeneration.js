path = require('path');
fs = require('fs');
querystring = require('querystring');

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
	var texturecoords = new Array(width * height * 2);
	var colours = new Array(width * height * 4);
	var indices = new Array(indexCount);

	for(var x = 0 ; x < width ; x++ ) {
		for(var y = 0 ; y < height ; y++ ) {
			var index = (x + y * width);

			var vertexIndex = index * 3;
			var colourIndex = index * 4;
			var texcoordsIndex = index * 2;
		
			vertices[vertexIndex] = startX + x;
			vertices[vertexIndex+1] = heightMap[index] * maxHeight;
			vertices[vertexIndex+2] = startY + y;

			texturecoords[texcoordsIndex] = x / width;
			texturecoords[texcoordsIndex+1] = y / height;

			var brightness = heightMap[index];
			if(brightness < 0.5) { brightness = 0.5; }
			colours[colourIndex++] = 0.0;
			colours[colourIndex++] = brightness;		
			colours[colourIndex++] = 0.0;
			colours[colourIndex] = 1.0;
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

	callback({
		vertices: vertices,
		colours: colours,
		indices: indices,
		texturecoords: texturecoords
	});
};
