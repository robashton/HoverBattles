var LandChunkModelLoader = function(resources){
    this._resources = resources;
};

LandChunkModelLoader.prototype.handles = function(path){
  return path.indexOf('chunk_') > -1;
};

LandChunkModelLoader.prototype.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
    
    var url = '/Landscape&height=' + (data.height) +
	'&width=' + (data.width) + 
	'&maxheight=' + data.maxHeight + 
	'&scale=' + data.scale +
	'&startx=' + data.x + 
	'&starty=' + data.y;
    
    var model = new LandChunk(data.height, data.width, data.maxHeight, data.scale, data.x, data.y);
    model.loadTextures(this._resources);
    
    var loader = this;
    LazyLoad.js(url, function () {
        var data = blah.Land[url];
        model.setData(data);
        callback();
    });
    
    return model;
};

exports.LandChunkModelLoader = LandChunkModelLoader;