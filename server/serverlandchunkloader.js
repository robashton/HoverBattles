var vec3 = require('../shared/glmatrix').vec3;
var mat4 = require('../shared/glmatrix').mat4;

var LandChunk = require('../shared/landchunk').LandChunk;

var createTerrainChunk = require('./LandscapeGeneration').createTerrainChunk;

var ServerLandChunkModelLoader = function(resources){
    this._resources = resources;
};

ServerLandChunkModelLoader.prototype.handles = function(path){
  return path.indexOf('chunk_') > -1;
};

ServerLandChunkModelLoader.prototype.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
        
    var model = new LandChunk(data.height, data.width, data.maxHeight, data.scale, data.x, data.y);   
    var data = createTerrainChunk(data.width, data.height, data.x, data.y, data.scale, data.maxHeight);
    model.setData(data);
    callback();
    return model;
};

exports.ServerLandChunkModelLoader = ServerLandChunkModelLoader;