var Model = require('./model').Model;

var DefaultModelLoader = function(resources){
    this._resources = resources;
};

DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.json') > -1;  
};

DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 5);
    var loader = this;
    
    $.getJSON('/data/models/' + path, function(data) {
      data.texture =  loader._resources.getTexture("/data/textures/" + name + ".jpg");
      model.setData(data);
         callback();      
    });
    
  //  setTimeout(function() { callback(); }, 100);
    
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;