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
    
    fs.readFile('./data/models/' + path, function(err, data) {        
        var modelData = JSON.parse(data);     
        model.setData(modelData);    
       callback();
    });
    return model;    
};

exports.ServerModelLoader = ServerModelLoader;