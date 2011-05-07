var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Model = function(data){
    this._programName = "default";
        
    if(data) { this.setData(data); }
	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;
    this._hasData = false;
};

Model.prototype.setData = function(data) {
    this._vertices = data.vertices;
    this._colours = data.colours;
	this._indices = data.indices;
    this._texCoords = data.texCoords;
    this._normals = data.normals;
    this._texture = data.texture;
    this._hasData = true;
    if(this._texCoords) { this._programName = "texture"; }
    else if( this._colours ) { this._programName = "colour"; }
};

Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.activate = function(context) {
	var gl = context.gl;

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW)

	if(this._colours) {
		this._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colours), gl.STATIC_DRAW)
	}
    if(this._texCoords) {
        this._textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._texCoords), gl.STATIC_DRAW)
    }
    
    if(this._normals) {
        this._normalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW)
    }

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

};

Model.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);

	if(this._colourBuffer) {
		gl.deleteBuffer(this._colourBuffer);
	}    
    if(this._textureBuffer) {
    	gl.deleteBuffer(this._textureBuffer);
    }  
    if(this._texture) {
        gl.deleteTexture(this._texture);
    }
    if(this._normalBuffer) {
        gl.deleteBuffer(this._normalBuffer);
    }

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
    this._textureBuffer = null;
    this._normalBuffer = null;
};


Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.upload = function(context) {
	var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	if(this._colourBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
	}
    
    if(this._textureBuffer) {
    	gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
    	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
    	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
    }    
    
    if(this._normalBuffer) {
        gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
        gl.vertexAttribPointer(gl.getAttribLocation(program, 'aNormals'), 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aNormals'));
    }
    
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
    
    if(this._texture){
       gl.activeTexture(gl.TEXTURE0);
       gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
       gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);      
    }
};

Model.prototype.render = function(context) {
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLES, this._indices.length , gl.UNSIGNED_SHORT, 0);
};

Model.Quad = function()
{
	return new Model({
				vertices: [			
				0.0, 0.0, 0, 
				1.0, 0.0, 0, 
				1.0, 1.0, 0, 
				0.0, 1.0, 0
				],
    			texCoords: [
        		    0.0, 0.0,
            	    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0
            	 ],
				indices: [0, 1, 2, 0, 2, 3]
			},
			"default"
		);
};

exports.Model = Model;

