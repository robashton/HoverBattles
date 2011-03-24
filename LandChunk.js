var blah = blah || {};

blah.LandChunk = function(width, height, maxHeight, scale,x,y){
	this._maxHeight = maxHeight;
	this._width = width;
	this._height = height;
	this._scale = scale;
	this._x = x;
	this._y = y;

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._indexCount = 0;
	this._colourBuffer = null;
	this._context = null;
};

blah.LandChunk.prototype.getProgram = function(){
	return "colour";
};

blah.LandChunk.prototype.createBuffers = function(context) {

	var gl = context.gl;

	var chunk = this;

	$.get('/Landscape' + 
					'&height=' + (this._height + 1) +
					'&width=' + (this._width + 1) + 
					'&scale=' + this._scale + 
					'&maxHeight=' + this._maxHeight +
					'&startx=' + this._x + 
					'&starty=' + this._y,
		function(json) {
  			var data = JSON.parse(json);

			chunk._vertexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, chunk._vertexBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW)

			chunk._colourBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ARRAY_BUFFER, chunk._colourBuffer);
			gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.colours), gl.STATIC_DRAW)

			chunk._indexBuffer = gl.createBuffer();
			gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chunk._indexBuffer);
			gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

			chunk._indexCount = data.indices.length;

	});
};

blah.LandChunk.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);
	gl.deleteBuffer(this._colourBuffer);
};

blah.LandChunk.prototype.uploadBuffers = function(context) {
	var gl = context.gl;
	var program = context.program;

	if(this._vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));

		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

	}
};

blah.LandChunk.prototype.render = function(context) {
	if(this._vertexBuffer != null) 
	{
		var gl = context.gl;
		gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
	}
};
