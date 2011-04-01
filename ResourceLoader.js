var blah = blah || {};

blah.ResourceLoader = function(){
  this._textureProviders = [];
  this._bufferProviders = [];
  this._textureCache = {};
  this._bufferCache = {};
  this._pendingTextureCount = 0;
};

blah.ResourceLoader.prototype.addTextureProvider = function(provider) {
    this._textureProviders.push(provider);    
};

blah.ResourceLoader.prototype.addBufferProvider = function(provider) {
    this._bufferProviders.push(provider);    
};


blah.ResourceLoader.prototype.getPendingTextureCount = function(){
    return this._pendingTextureCount;
};

blah.ResourceLoader.prototype.getBuffer = function(name, callback) {
   var cachedBuffer = this._bufferCache[name];
  if(cachedBuffer) {  callback(cachedBuffer); return; }
  
  for(var i in this._bufferProviders){
   var provider = this._bufferProviders[i];
   if(!provider.handles(name)){ continue; }
   
   var loadedBuffer = provider.load(name);
   this._bufferCache[name] = loadedBuffer;
   callback(loadedBuffer);
   return;
  }  
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