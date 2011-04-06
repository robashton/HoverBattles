var blah = blah || {};

blah.LandChunk = function(width, height, maxHeight, scale,x,y){
    this._maxHeight = maxHeight;
	this._width = width;
	this._height = height;
	this._x = x;
	this._y = y;
    this._scale = scale;

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._indexCount = 0;
	this._colourBuffer = null;
	this._texturecoordsBuffer = null;
	
	this._texture = null;
    this._detailtexture = null;
    this._hovertexture = null;
    this._data = null;
    
    this._frame = 0.0;
    this._playerPosition = vec3.create();
    
};

blah.LandChunk.prototype.loadTextures = function(resources) {
    this._texture = resources.getTexture("/textures/gridlow.jpg");
    this._detailtexture = resources.getTexture("/textures/gridhigh.jpg");
    this._hovertexture = resources.getTexture("/textures/bars.jpg");
};

blah.LandChunk.prototype.setData = function(data) {
    this._data = data;
};

blah.LandChunk.prototype.activate = function(context) {
    var gl = context.gl;
  	 
	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.vertices), gl.STATIC_DRAW)

	this._colourBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.colours), gl.STATIC_DRAW)
	
	this._texturecoordsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.texturecoords), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._data.indices), gl.STATIC_DRAW);

	this._indexCount = this._data.indices.length;    	
    
};
