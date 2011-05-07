var Model = require('./model').Model;

var DefaultModelLoader = function(resources){
    this._resources = resources;
};

DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 3);
    var loader = this;
    
    $.get('/data/models/' + path, function(data) {
      var modelData = JSON.parse(data);
      modelData.texture =  loader._resources.getTexture("/data/textures/" + name + ".jpg");
      model.setData(modelData);
         callback();      
    });
    
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;