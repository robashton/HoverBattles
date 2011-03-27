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
	this._context = null;
    this._vertices
	
	this._texture = null;
    this._heightMap = null;
    
};

blah.LandChunk.prototype.getData = function(callback) {
    $.get('/Landscape' + 
    			'&height=' + (this._height) +
    			'&width=' + (this._width) + 
    			'&maxheight=' + this._maxHeight + 
        		'&scale=' + this._scale,
    			'&startx=' + this._x + 
    			'&starty=' + this._y,
    function(json) {
         var data = JSON.parse(json); 
         callback(data);
    });
};

blah.LandChunk.prototype.getProgram = function(){
    return "landscape";
};

blah.LandChunk.prototype.getHeightAt = function(x, z) {
    if(!this._heightMap) {
        return 6;
    }
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
        
    var topLeft = this._heightMap[leftX + topX * this._width];
    var topRight = this._heightMap[rightX + topX * this._width];
    var bottomLeft = this._heightMap[leftX + bottomX * this._width];
    var bottomRight = this._heightMap[rightX + bottomX * this._width];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top;
};

blah.LandChunk.prototype.createBuffers = function(context) {

	var gl = context.gl;

	var chunk = this;

	this.getData(function(data){
      	 
        chunk._heightMap = data.heights;
   
		chunk._vertexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, chunk._vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.vertices), gl.STATIC_DRAW)

		chunk._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, chunk._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.colours), gl.STATIC_DRAW)
		
		chunk._texturecoordsBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, chunk._texturecoordsBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data.texturecoords), gl.STATIC_DRAW)

		chunk._indexBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, chunk._indexBuffer);
		gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(data.indices), gl.STATIC_DRAW);

		chunk._indexCount = data.indices.length;
		
		chunk._texture = gl.createTexture();
		chunk._texture.image = new Image();
		chunk._texture.image.onload = function() {
		 	gl.bindTexture(gl.TEXTURE_2D, chunk._texture);
		 	gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, chunk._texture.image);
		 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
		 	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
		 	gl.bindTexture(gl.TEXTURE_2D, null);
		}			
		chunk._texture.image.src = "/textures/grass.jpg";
	});
};

blah.LandChunk.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);
	gl.deleteBuffer(this._colourBuffer);
	gl.deleteTexture(this._texture);
};

blah.LandChunk.prototype.uploadBuffers = function(context) {
	var gl = context.gl;
	var program = context.program;

	if(this._vertexBuffer != null) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
				
		gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
	
		gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
		
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this._texture);
		gl.uniform1i(program.samplerUniform, 0); 
	}
};

blah.LandChunk.prototype.render = function(context) {
	if(this._vertexBuffer != null) 
	{
		var gl = context.gl;
		gl.drawElements(gl.LINE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
	}
};