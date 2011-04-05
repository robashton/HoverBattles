var blah = blah || {};

blah.DefaultModelLoader = function(){
};

blah.DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

blah.DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new blah.Model();
    var name = path.substr(0, path.length - 3);
    
    LazyLoad.js('/models/' + path, function () {
        model.setData({
             vertices: BlenderExport[name].vertices,
             indices: BlenderExport[name].indices,
             texCoords: BlenderExport[name].texCoords,
             normals: BlenderExport[name].normals,
             texture: "/textures/" + name + ".jpg"
         });
         callback();
    });
    
    return model;
};