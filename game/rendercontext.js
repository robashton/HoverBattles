
var RenderContext = function(resourceLoader){
    this.gl = null;
	this.programs = {};
};

RenderContext.prototype.init = function(selector) {
  var canvas =  document.getElementById(selector);

  this.gl = canvas.getContext("experimental-webgl");

  this.gl.viewportWidth = canvas.width;
  this.gl.viewportHeight = canvas.height;  

  this.gl.clearColor(0.0, 0.5, 0.5, 1.0);
  this.gl.enable(this.gl.DEPTH_TEST);  
};

RenderContext.prototype.createProgram = function(programName) {
	
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


RenderContext.prototype.setActiveProgram = function(programName) {
	if(!this.programs[programName]) { this.createProgram(programName); }
	var program = this.programs[programName];

	this.gl.useProgram(program);
	this.program = program;
	return program;
}; 

exports.RenderContext = RenderContext;

