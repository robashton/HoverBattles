var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var LandChunk = function(width, height, maxHeight, scale,x,y){
  this._maxHeight = maxHeight;
  this._width = width;
  this._height = height;
  this._x = x;
  this._y = y;
  this._scale = scale;

  this._vertexBuffer = null;
  this._indexBuffer = null;
  this._indexCount = 0;
  this._texturecoordsBuffer = null;
  this._heightBuffer = null;

  this._diffuseTexture = null;
  this._data = null;

  this._frame = 0.0;
  this._playerPosition = vec3.create();
  this._cameraPosition = vec3.create();
};

LandChunk.prototype.getProgram = function(){
    return "landscape";
};

LandChunk.prototype.loadTextures = function(resources) {
    this._diffuseTexture = resources.getTexture('/data/textures/grid.png');
};

LandChunk.prototype.setData = function(data) {
    this._data = data;
};

LandChunk.prototype.activate = function(context) {
    var gl = context.gl;
  	 
	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.vertices), gl.STATIC_DRAW);

  this._heightBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._heightBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.heights), gl.STATIC_DRAW);
    
	this._texturecoordsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.texturecoords), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._data.indices), gl.STATIC_DRAW);

	this._indexCount = this._data.indices.length;    	
};

LandChunk.prototype.upload = function(context) {
  if(!this._data) { return; }
    var gl = context.gl;
	var program = context.program;

  // Theoretically we'll not to keep re-uploading these if we do something with our scene
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoord'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoord'));
      
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this._diffuseTexture.get());
	gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0); 

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

  // This is the only thing we have to re-upload
	gl.bindBuffer(gl.ARRAY_BUFFER, this._heightBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexHeight'), 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexHeight'));


};

LandChunk.prototype.render = function(context) {
  if(!this._data) { return; }
  this._frame++;
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
};

LandChunk.prototype.getHeightAt = function(x, z) {
    if(!this._data) {
        return 6;
    }
    
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
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top;
};

exports.LandChunk = LandChunk;
