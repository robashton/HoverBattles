var blah = blah || {};

blah.DefaultTextureLoader = function(app){
    this._app = app;  
};

blah.DefaultTextureLoader.prototype.load = function(path, callback) {
  var gl = this._app.context.gl;
  
  var data = gl.createTexture();
  data.image = new Image();
  data.image.onload = function() {
       gl.bindTexture(gl.TEXTURE_2D, data);
       gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
       gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
   	   gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
       gl.generateMipmap(gl.TEXTURE_2D);
   	   gl.bindTexture(gl.TEXTURE_2D, null);
       callback();
  }    
  data.image.src = path;
  var texture = new blah.Texture(path);
  texture.setData(data);
  return texture; 
};