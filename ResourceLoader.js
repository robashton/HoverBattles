var blah = blah || {};

blah.ResourceLoader = function(){
  this._textureProviders = [];
  this._textureCache = {};
  this._pendingTextureCount = 0;
};

blah.ResourceLoader.prototype.addTextureProvider = function(provider) {
    this._textureProviders.push(provider);    
};

blah.ResourceLoader.prototype.getPendingTextureCount = function(){
    return this._pendingTextureCount;
};

blah.ResourceLoader.prototype.getTexture = function(name) {
    var cachedTexture = this._textureCache[name];
    if(cachedTexture) { return cachedTexture; }
    
    this._pendingTextureCount++;
    var loader = this;
    
    for(var i in this._textureProviders){
     var provider = this._textureProviders[i];
     if(!provider.handles(name)){ continue; }
     var loadedTexture = provider.load(name, function() { loader._pendingTextureCount--;});
     this._textureCache[name] = loadedTexture;
     return loadedTexture;
    }  
};