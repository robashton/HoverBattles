var Chunk = require('./landchunk').LandChunk;

exports.Landscape = function() {
  var self = this;

  var chunks = [];
  var chunksByKey = {};

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

    var chunkKey = convertWorldCoordsIntoChunkKey(x, z);
    var chunk = retrieveChunkWithKey(chunkKey);

    if(!chunk) return -100;

    // Transform world coords into er.. 'global array space'
    var indexX = (x / data.scale);
    var indexZ = (z / data.scale);

    return chunk.getHeightAt(indexX, indexZ);
  };  

  var createChunksFromData = function() {
    for(var i = 0; i < data.chunks.length; i++) {
      var dataForChunk = data.chunks[i];
      var chunk = new Chunk(dataForChunk, data.scale, data.vertexWidth);
      chunks.push(chunk);
      chunksByKey[chunk.key()] = chunk;
    }
  };

  var retrieveChunkWithKey = function(key) {
    return chunksByKey[key];
  };

  var convertWorldCoordsIntoChunkKey = function(x, z) {
    var multiplier = data.chunkWidth * data.scale;
    
    var currentChunkX = parseInt(x / multiplier) * multiplier;
    var currentChunkZ = parseInt(z / multiplier) * multiplier;
    
    if(x < 0) { currentChunkX -= multiplier; }
    if(z < 0) { currentChunkZ -= multiplier; }

    return currentChunkX + '_' + currentChunkZ;    
  };
};
