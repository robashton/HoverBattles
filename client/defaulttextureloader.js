var blah = blah || {};

blah.DefaultTextureLoader = function(app){
    this._app = app;  
};

blah.DefaultTextureLoader.prototype.load = function(path, callback) {

  var image = new Image();
  image.onload = function(){
    callback();  
  };
  
  image.src = path;
  var texture = new blah.Texture(path, image);
  return texture; 
};