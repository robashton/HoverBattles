var Chunk = require('./landchunk').LandChunk;

exports.Landscape = function() {
  var self = this;

  var chunks = [];
  var data = null;
  var texture = null;

  var vertexBuffer = null;
  var indexBuffer = null;
  var indexCount = 0;
  var texturecoordsBuffer = null;
  var scene = null;

  self.setScene = function(newScene) {
    scene = newScene;
  };  

  self.setData = function(newData) {
    data = newData;
    createChunksFromData();
  };

  self.loadTextures = function(resources) {
    texture = resources.getTexture('/data/textures/grid.png');
  };

  self.render = function(context) {
    if(!data) return;
	  var gl = context.gl;

    uploadSharedBuffers(context);

    for(var i = 0 ; i < chunks.length; i++) {
      var chunk = chunks[i];
      chunk.upload(context);
      gl.drawElements(gl.TRIANGLE_STRIP, indexCount, gl.UNSIGNED_SHORT, 0);
    } 
  };

  var uploadSharedBuffers = function(context) {
    var gl = context.gl;

    var program = context.setActiveProgram('landscape');

	  var viewMatrix = scene.camera.getViewMatrix();
	  var projectionMatrix = scene.camera.getProjectionMatrix();

    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);    

	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 2, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	  gl.bindBuffer(gl.ARRAY_BUFFER, texturecoordsBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoord'), 2, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoord'));
        
	  gl.activeTexture(gl.TEXTURE0);
	  gl.bindTexture(gl.TEXTURE_2D, texture.get());
	  gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0); 

	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
  };

  self.activate = function(context) {
    var gl = context.gl;

	  vertexBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.shared.vertices), gl.STATIC_DRAW);
      
	  texturecoordsBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, texturecoordsBuffer);
	  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.shared.texturecoords), gl.STATIC_DRAW)

    indexBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
	  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.shared.indices), gl.STATIC_DRAW);

	  indexCount = data.shared.indices.length;    	

    for(var i = 0 ; i < chunks.length; i++)
      chunks[i].activate(context);
  };

  self.getHeightAt = function(x, z) {
    // Index appropriately into the data we've got stored locally
    return 100;
  };  

  var createChunksFromData = function() {
    for(var i = 0; i < data.chunks.length; i++) {
      var dataForChunk = data.chunks[i];
      var chunk = new Chunk(dataForChunk);
      chunks.push(chunk);
    }
  };

  var getHeightFromChunk = function() {
/*
    var heightmap = this._data.heights;
    
    // Transform to values we can (almost) index our array with
    var transformedX = x - this._x;
    var transformedZ = z - this._y;
    
    var baseX = Math.floor(transformedX);
    var baseZ = Math.floor(transformedZ);

    var horizontalWeight = transformedX - baseX;
    var verticalWeight = transformedZ - baseZ; 
    
    var leftX = baseX;
    var rightX = baseX + 1;
    var topX = baseZ; 
    var bottomX = baseZ + 1;
        
    var topLeft = heightmap[leftX + topX * this._width];
    var topRight = heightmap[rightX + topX * this._width];
    var bottomLeft = heightmap[leftX + bottomX * this._width];
    var bottomRight = heightmap[rightX + bottomX * this._width];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top; */
  };

};
