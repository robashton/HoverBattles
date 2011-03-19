var blah = blah || {};

blah.Model = function(vertices, indices){
	this._vertices = vertices;
	this._indices = indices;
	this._vertexBuffer = null;
	this._indexBuffer = null;
};

blah.Model.prototype.createBuffers = function(context) {
	var gl = context.gl;

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);
};

blah.Model.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);
};


blah.Model.prototype.uploadBuffers = function(context) {
	var gl = context.gl;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
};

blah.Model.prototype.render = function(context) {
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLES, this._indices.length , gl.UNSIGNED_SHORT, 0);
};


// Utils
blah.Model.Quad = function()
{
	return new blah.Model(
			[			
			0.0, 0.0, 0, 
			1.0, 0.0, 0, 
			1.0, 1.0, 0, 
			0.0, 1.0, 0
			],
			[0, 1, 2, 0, 2, 3]
		);
};
