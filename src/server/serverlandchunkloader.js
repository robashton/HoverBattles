var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var LandChunk = require('../entities/landchunk').LandChunk;
var LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;


exports.ServerLandChunkModelLoader = function(resources) {
  var self = this;

  self.handles = function(path){
    return path.indexOf('chunk_') > -1;
  };

  self.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
        
    var model = new LandChunk(data.width, data.height, data.maxHeight, data.scale, data.x, data.y);   
    var data = createTerrainChunk(data.width, data.height, data.x, data.y, data.scale, data.maxHeight);
    model.setData(data);
    callback();
    
    return model;
  };
  
  var createTerrainChunk = function(width, height, x, y, scale, maxHeight) {
    var generator = new LandscapeGeneration(width, height, x, y, scale, maxHeight);
    return generator.create();
  };
}; 
