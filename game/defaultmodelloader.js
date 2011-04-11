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
    LazyLoad.js('/models/' + path, function () {
        model.setData({
             vertices: BlenderExport[name].vertices,
             indices: BlenderExport[name].indices,
             texCoords: BlenderExport[name].texCoords,
             normals: BlenderExport[name].normals,
             texture: loader._resources.getTexture("/textures/" + name + ".jpg")
         });
         callback();
    });
    
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;