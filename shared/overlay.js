var mat4 = require('glmatrix').mat4;

var OverlayItem = function(id, texture) {
  var self = this;
  var id = id;
  var texture = texture;
  var width = 100;
  var height = 100;
  var top = 0;
  var left = 0;
  var rotation = 0;

  self.id = function() {
    return id;
  };

  self.top = function(value) {
    return top = value || top;
  }; 

  self.left = function(value) {
    return left = value || left;
  };

  self.width = function(value) {
    return width = value || width;
  };

  self.height = function(value) {
    return height = value || height;
  };  

  self.texture = function() {
    return texture.get();
  };

  self.rotation = function(value) {
    return rotation = value || rotation;
  };
};

exports.Overlay = function(app) {
  var self = this;
  var app = app;
  var vertexBuffer = null;
  var quadTextureBuffer = null;
  var items = {};

  var quadVertices =  [
         0.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         0.0,  1.0,  0.0,
         1.0,  1.0,  0.0
    ];

  var quadTextureCoords =  [
         0.0,  0.0, 
         1.0,  0.0,
         0.0,  1.0,
         1.0,  1.0,
    ];

  self.addItem = function(id, textureName) {
    var item = new OverlayItem(id, app.resources.getTexture(textureName));
    items[id] = item;
    return item;
  };

  self.removeItem = function(item) {
    delete items[item.id()];
  };

  self.activate = function(context) {
    var gl = context.gl;

	  vertexBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

	  quadTextureBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadTextureCoords), gl.STATIC_DRAW);
  };

  self.deactivate = function(context) {
    gl.destroyBuffer(vertexBuffer);
  };

  self.render = function(context) {
    var gl = context.gl;   
    var program = context.setActiveProgram("hud"); 

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);  

    var projectionMatrix = mat4.ortho(0, context.currentWidth(), context.currentHeight(), 0, -1, 1);
    var viewMatrix = mat4.lookAt([0,0,0], [0,0,-1], [0,1,0]);

    // Upload the quad
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    
    // And the texture coords
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));

    // Set the orthographic projection setup
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);

    for(var i in items) {
      var item = items[i];
      var worldMatrix = mat4.create();
      mat4.identity(worldMatrix);

      mat4.translate(worldMatrix, [item.left() + (0.5 * item.width()), item.top() + (0.5 * item.height()), 0.0]);
      mat4.rotateZ(worldMatrix, item.rotation());
      mat4.translate(worldMatrix, [-(0.5 * item.width()), -(0.5 * item.height()), 0.0]);
      mat4.scale(worldMatrix, [item.width(), item.height() , 1.0]);
      
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, item.texture());
      gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);  

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
       
    }

    gl.disable(gl.BLEND);
    gl.depthMask(true);

  }; 

};
