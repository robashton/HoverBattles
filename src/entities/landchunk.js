var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;


exports.LandChunk = function(data, scale, width) {
  var self = this;

  var heightBuffer = null;
  var transform = mat4.create();
  mat4.identity(transform);
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

  self.key = function() {
    return data.x + '_' + data.y;
  };

  self.getHeightAt = function(x, z) {
    var heightmap = data.heights;
    
    // Transform to values we can (almost) index our array with
    var transformedX = x - (data.x / scale);
    var transformedZ = z - (data.y / scale);
    
    var baseX = Math.floor(transformedX);
    var baseZ = Math.floor(transformedZ);

    var horizontalWeight = transformedX - baseX;
    var verticalWeight = transformedZ - baseZ; 
    
    var leftX = baseX;
    var rightX = baseX + 1;
    var topX = baseZ; 
    var bottomX = baseZ + 1;
        
    var topLeft = heightmap[leftX + topX * (width + 1)];
    var topRight = heightmap[rightX + topX * (width + 1)];
    var bottomLeft = heightmap[leftX + bottomX * (width + 1)];
    var bottomRight = heightmap[rightX + bottomX * (width + 1)];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top; 
  };
}
