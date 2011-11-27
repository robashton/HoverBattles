var mat4 = require('../thirdparty/glmatrix').mat4;

var OverlayItem = function(id, texture) {
  var self = this;
  var id = id;
  var texture = texture;
  var width = 1;
  var height = 1;
  var top = -100;
  var left = -1000;
  var rotation = 0;
  var visible = true;

  self.id = function() {
    return id;
  };

  self.show = function() {
    visible = true;
  };

  self.hide = function() {
    visible = false;
  };

  self.top = function(value) {
    return top = value === undefined ? top : value;
  }; 

  self.left = function(value) {
    return left = value === undefined ? left : value;
  };

  self.width = function(value) {
    return width = value === undefined ? width : value;
  };

  self.height = function(value) {
    return height = value === undefined ? height : value;
  };  

  self.isVisible = function() {
    return visible;
  };

  self.texture = function() {
    return texture.get();
  };

  self.rotation = function(value) {
    return rotation = value === undefined ? rotation : value;
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
         0.0,  1.0, 
         1.0,  1.0,
         0.0,  0.0,
         1.0,  0.0,
    ];

  self.addItem = function(id, texture) {
    var item = null; 
    if(typeof(texture) === 'string')      
      item = new OverlayItem(id, app.resources.getTexture(texture));
    else 
      item = new OverlayItem(id, { get: function() { return texture; } });

    items[id] = item;
    return item;
  };

  self.removeItem = function(item) {
    if(item.cleanup) item.cleanup();
    delete items[item.id()];
  };

  self.addTextItem = function(id, text, width, height, colour, font) {
    var textCanvas  = document.getElementById('scratch');
    var textContext = textCanvas.getContext("2d");

    textCanvas.width = width || 128;
    textCanvas.height = height || 128;
    textContext.fillStyle = colour || 'white';
    textContext.font = font || "bold 12px sans-serif";
    textContext.fillText(text, 0, height / 2.0);

    var gl = app.context.gl;
    var texture = gl.createTexture();              
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);           
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);                 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var item = this.addItem(id, texture);
    item.width(width || 128);
    item.height(height || 128);
    item.cleanup = function() {
      gl.deleteTexture(texture);
    };
    return item;
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
      if(!item.isVisible()) continue;

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
