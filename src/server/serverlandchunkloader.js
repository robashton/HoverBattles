var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var Landscape = require('../entities/landscape').Landscape;
var LandLoader = require('./landloader').LandLoader;


exports.ServerLandChunkModelLoader = function(resources) {
  var self = this;

  self.handles = function(path){
    return path.indexOf('terrain') > -1;
  };

  self.load = function(id, callback) {        
    var model = new Landscape(); 
    var data = new LandLoader().getLand();
    model.setData(data);
    callback();    
    return model;
  };
}; 
