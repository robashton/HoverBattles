var blah = blah || {};

blah.DefaultModelProvider = function(){
};

blah.DefaultModelProvider.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

blah.DefaultModelProvider.prototype.load = function(path, callback) {
    
    var name = path.substr(0, path.length - 3);
    LazyLoad.js('/models/' + path, function () {
         var model = new blah.Model({
             vertices: BlenderExport[name].vertices,
             indices: BlenderExport[name].indices,
             texCoords: BlenderExport[name].texCoords,
             normals: BlenderExport[name].normals
         },
         BlenderExport[name].program);
         model._textureName = "/textures/" + name + ".jpg";
         callback(model);
    });
};