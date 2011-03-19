var blah = blah || {};

blah.RenderContext = function(){
	this.gl = null;
	this.program = null;
};

blah.RenderContext.prototype.init = function(selector) {
	var canvas =  document.getElementById(selector);

   this.gl = canvas.getContext("experimental-webgl");

   this.gl.viewportWidth = canvas.width;
   this.gl.viewportHeight = canvas.height;  

	this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
   this.gl.enable(this.gl.DEPTH_TEST);  

	this._fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	this._vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

   this.gl.shaderSource(this._fragmentShader, blah.RenderContext.DefaultFragment);
   this.gl.compileShader(this._fragmentShader);

   this.gl.shaderSource(this._vertexShader, blah.RenderContext.DefaultShader );
   this.gl.compileShader(this._vertexShader);

	if (!this.gl.getShaderParameter(this._vertexShader, this.gl.COMPILE_STATUS)) {
		 throw gl.getShaderInfoLog(this._vertexShader);
	}
	if (!this.gl.getShaderParameter(this._fragmentShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(this._fragmentShader);
	}

   this.program = this.gl.createProgram();
	this.gl.attachShader(this.program, this._vertexShader);
   this.gl.attachShader(this.program, this._fragmentShader );
   this.gl.linkProgram(this.program);

	if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
		throw "Couldn't create program";
	}	

	this.gl.useProgram(this.program);
};


blah.RenderContext.DefaultFragment = "#ifdef GL_ES\nprecision highp float;\n#endif\nvoid main(void) {\ngl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n}\n";
blah.RenderContext.DefaultShader = "attribute vec3 aVertexPosition;\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\nvoid main(void){\ngl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n}\n";
