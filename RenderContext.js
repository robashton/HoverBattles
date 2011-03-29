var blah = blah || {};

blah.RenderContext = function(){
	this.gl = null;
	this.programs = {};
};

blah.RenderContext.prototype.init = function(selector) {
	var canvas =  document.getElementById(selector);

   this.gl = canvas.getContext("experimental-webgl");

   this.gl.viewportWidth = canvas.width;
   this.gl.viewportHeight = canvas.height;  

	this.gl.clearColor(0.0, 0.5, 0.5, 1.0);
    this.gl.enable(this.gl.DEPTH_TEST);  

    this._textures = {};
};

// To be replaced with resource manager
blah.RenderContext.prototype.getTexture = function(path) {
    if(this._textures[path]) { return this._textures[path]; }
    var gl = this.gl;
    
    var texture = gl.createTexture();
    texture.image = new Image();
    texture.image.onload = function() {
         gl.bindTexture(gl.TEXTURE_2D, texture);
     	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texture.image);
     	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
     	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
         gl.generateMipmap(gl.TEXTURE_2D);
     	gl.bindTexture(gl.TEXTURE_2D, null);
    }    
    texture.image.src = path;
    this._textures[path] = texture;
    return texture;
}

blah.RenderContext.prototype.createProgram = function(programName) {
	
	var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
	
   this.gl.shaderSource(fragmentShader, blah.Shaders[programName].Fragment);
   this.gl.compileShader(fragmentShader);

   this.gl.shaderSource(vertexShader, blah.Shaders[programName].Shader);
   this.gl.compileShader(vertexShader);

	if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(vertexShader);
	}
	if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(fragmentShader);
	}

   var program = this.gl.createProgram();
	this.gl.attachShader(program, vertexShader);
   this.gl.attachShader(program, fragmentShader);
   this.gl.linkProgram(program);	

	if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
		throw "Couldn't create program";
	}	

	this.programs[programName] = program;
};


blah.RenderContext.prototype.setActiveProgram = function(programName) {
	if(!this.programs[programName]) { this.createProgram(programName); }
	var program = this.programs[programName];

	this.gl.useProgram(program);
	this.program = program;
	return program;
}; 


