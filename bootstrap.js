var blah = blah || {};

$app = function(callback){    
  LazyLoad.js([        
      '/game.js',
      '/Shaders.js',
      '/socket.io/socket.io.js'
      ],
    callback
   );
};

blah.Application = function(target) {
  this._target = target;  
  this.context = null;
  this.isClient = true;
};

blah.Application.prototype.init = function(finishedCallback){
  var RenderContext = require('./rendercontext').RenderContext;
 

  var context = new RenderContext();
  context.init(this._target);
  this.go(context);
  finishedCallback();    
};

blah.Application.prototype.go = function(context) {
  var app = this;
  app.context = context;

  var Scene = require('./scene').Scene;
  var ResourceManager = require('./resources').ResourceManager;
  var DefaultTextureLoader = require('./defaulttextureloader').DefaultTextureLoader;
  var DefaultModelLoader = require('./defaultmodelloader').DefaultModelLoader;
  var LandChunkModelLoader = require('./landchunkloader').LandChunkModelLoader;
  var Controller = require('./controller').Controller;
  var RenderPipeline = require('renderpipeline').RenderPipeline;
  var Overlay = require('./overlay').Overlay;

  app.scene = new Scene(this);
  app.resources = new ResourceManager(this);  
  app.resources.setTextureLoader(new DefaultTextureLoader(app));
  app.resources.addModelLoader(new DefaultModelLoader(this.resources));
  app.resources.addModelLoader(new LandChunkModelLoader(this.resources));
  app.controller = new Controller(this.scene);
  app.overlay = new Overlay(this);
  app.overlay.activate(context);

  app.rendering = new RenderPipeline(this);
  app.rendering.init(app.context);
};

blah.Application.prototype.tick = function(){
  this.controller.tick();  
};

blah.Application.prototype.render = function(){  
   this.rendering.render(this.context);
   this.overlay.render(this.context);
};



























