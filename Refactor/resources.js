var blah = blah || {};

blah.ResourceManager = function(app){
    this._app = app;
    this._textureLoaders = [];
    this._modelLoaders = [];
    
    this._textureLoader = new blah.DefaultTextureLoader(app);
    this._modelLoader = new blah.DefaultModelLoader(this);
};

blah.ResourceManager.prototype.getTexture = function(path){
    return this._textureLoader.load(path, function(){
        
    });
};

blah.ResourceManager.prototype.getModel = function(path) {
    return this._modelLoader.load(path, function() {
        
    });
};