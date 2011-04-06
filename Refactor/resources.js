var blah = blah || {};

blah.ResourceManager = function(app){
    this._app = app;
    this._modelLoaders = [];
    
    this._textureLoader = new blah.DefaultTextureLoader(app);
    this._modelLoaders.push( new blah.DefaultModelLoader(this) );
    
    this._textures = {};
    this._models = {};
};

blah.ResourceManager.prototype.getTexture = function(path){
    if(this._textures[path]) return this._textures[path];   
    
    var resources = this;
    var texture = this._textureLoader.load(path, function(){
            resources.registerForActivation(texture);
        });

    this._textures[path] = texture;
    return texture;    
};

blah.ResourceManager.prototype.registerForActivation = function(resource) {
  
  resource.activate(this._app.context, function() {
      
  });
  
};

blah.ResourceManager.prototype.getModel = function(path) {
    if(this._models[path]) return this._models[path];

    var resources = this;
    for(i in this._modelLoaders){
        var loader = this._modelLoaders[i];
        if(loader.handles(path)){
            var model = loader.load(path, function() {
                  resources.registerForActivation(model);  
                });
            this._models[path] = model;
            return model;
        }
    }
};