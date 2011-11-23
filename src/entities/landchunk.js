var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;


exports.LandChunk = function(data) {
  var self = this;

  var heightBuffer = null;
  var transform = mat4.create();
  mat4.translate(transform, [data.x, 0, data.y]);

  self.upload = function(context) {
    var gl = context.gl;
	  var program = context.program;

	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, transform);
   
	  gl.bindBuffer(gl.ARRAY_BUFFER, heightBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexHeight'), 1, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexHeight'));
  };

  self.activate = function(context) {
    var gl = context.gl;
    heightBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, heightBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.heights), gl.STATIC_DRAW);
  };
};
