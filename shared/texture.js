var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Texture = function(name, image){
    this._data = null;
    this._image = image;
    this._name = name;
};

Texture.prototype.get = function(){
    return this._data;
};

Texture.prototype.activate = function(context) {
    var gl = context.gl;
    var data = gl.createTexture();
    this._data = data;
    
    data.image = this._image;
    gl.bindTexture(gl.TEXTURE_2D, data);


    // We'll assume if they're equal that they're powers of 2, and if not, they're not
    if(data.image.width !== data.image.height) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
   

    gl.bindTexture(gl.TEXTURE_2D, null);
};

exports.Texture = Texture;
