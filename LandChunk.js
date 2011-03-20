var blah = blah || {};

blah.LandChunk = function(heightMap, width, height, scale){
	this._heightMap = heightMap;	
	this._width = width;
	this._height = height;
	this._scale = scale;

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
	this._indexCount = (this._height - 1) * this._width * 2;
};

blah.LandChunk.prototype.getProgram = function(){
	return "default";
};

blah.LandChunk.prototype.createBuffers = function(context) {

	var gl = context.gl;

	var data = this.createBufferData();

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW)

/*	if(this._colours) {
		this._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.colours), gl.STATIC_DRAW)
	}
*/
	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

};

blah.LandChunk.prototype.createBufferData = function() {
	var vertices = new Float32Array(this._width * this._height * 3);
	var indices = new Uint16Array(this._indexCount);

	for(var x = 0 ; x < this._width ; x++ ) {
		for(var y = 0 ; y < this._height ; y++ ) {
			var index = (x + y * this._width) * 3;
			vertices[index] = x;
			vertices[index+1] = this._heightMap[x + y * this._width];
			vertices[index+2] = y;
		}
	}

	var topRowIndex = 0;
	var bottomRowIndex = this._width;

	var goingRight = true;
	var i = 0;

	// Trying to do an indexed triangle strip...
	// We go right until we reach the end of a row
	// And then come back again on the next row
	// And repeat until we run out of vertices
	while(i < this._indexCount)
	{
		if(goingRight) {
			indices[i++] = topRowIndex++;
			indices[i++] = bottomRowIndex++;
			
			if(topRowIndex % this._width == 0){
				goingRight = false;
				topRowIndex = bottomRowIndex-1;
				bottomRowIndex = topRowIndex + this._width;				
			}
		} else {
			indices[i++] = topRowIndex--;
			indices[i++] = bottomRowIndex--;

			if((topRowIndex+1) % this._width == 0){
				goingRight = true;
				topRowIndex = bottomRowIndex+1;
				bottomRowIndex = topRowIndex + this._width;				
			}
		}
	}	
		
	return {
		vertices: vertices,
		indices: indices,
		colours: []	
	};

};

blah.LandChunk.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);
};

blah.LandChunk.prototype.uploadBuffers = function(context) {
	var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
};

blah.LandChunk.prototype.render = function(context) {
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
};
