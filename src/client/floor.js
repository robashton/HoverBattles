exports.Floor = function() {
    
};

var FloorModel = function(app) {
  var self = this;

  var texture = app.resources.getTexture("/data/textures/grid.png");
  var vertexBuffer = null;
  var textureBuffer = null;

  self.activate = function(context) {
    var gl = context.gl;

   	vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorVertices), gl.STATIC_DRAW);

	  textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(floorTextureCoords), gl.STATIC_DRAW); 
  };

  self.getProgram = function() { return 'floor'; }

  self.upload = function(context) {
	  var gl = context.gl;
	  var program = context.program;

	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
      
  	gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoord'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoord'));

    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);      
 
  };

  self.render = function(context) {
    var gl = context.gl;
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  };

};

exports.Floor.Create = function(app) {
  var entity = new Entity('floor');

  var floorModel = new FloorModel(app);
  entity.setModel(floorModel);
  floorModel.activate(app.context);
  app.scene.addEntity(entity);    

  return entity;
};

var floorVertices =  [
   -2560.0,  -90.0,  -2560.0,
   2560.0,  -90.0,  -2560.0,
   -2560.0,  -90.0,  2560.0,
   2560.0,  -90.0,  2560.0
];

var floorTextureCoords =  [
   0.0,  0.0, 
   1.0,  0.0,
   0.0,  1.0,
   1.0,  1.0,
];
