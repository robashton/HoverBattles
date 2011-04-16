var Model = require('../shared/model').Model;
var fs = require('fs');

var ServerModelLoader = function(){
};

ServerModelLoader.prototype.handles = function(path){
  return path.indexOf('.js') > -1;  
};

ServerModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 3);
    var loader = this;
    
    fs.readFile('./models/' + path, function(err, data) {
        var func = '(function(){';
        func += data;
        func += '\n';
        func += 'return BlenderExport;'
        func += '})();';
        
        var modelData = eval(func);
     
        model.setData({
            vertices: modelData[name].vertices,
             indices: modelData[name].indices,
             texCoords: modelData[name].texCoords,
             normals: modelData[name].normals            
        });    
    
       callback();
    });
    return model;    
};

exports.ServerModelLoader = ServerModelLoader;