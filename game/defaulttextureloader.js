var DefaultTextureLoader = function(app){
    this._app = app;  
};

DefaultTextureLoader.prototype.load = function(path, callback) {

  var image = new Image();
  image.onload = function(){
    callback();  
  };
  
  image.src = path;
  var texture = new Texture(path, image);
  return texture; 
};

exports.DefaultTextureLoader = DefaultTextureLoader;