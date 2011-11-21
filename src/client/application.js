var Scene = require('../core/scene').Scene;
var ResourceManager = require('../core/resources').ResourceManager;
var DefaultTextureLoader = require('../core/defaulttextureloader').DefaultTextureLoader;
var DefaultModelLoader = require('../core/defaultmodelloader').DefaultModelLoader;
var Controller = require('../core/controller').Controller;
var RenderContext = require('../core/rendercontext').RenderContext;
var RenderPipeline = require('../core/renderpipeline').RenderPipeline;

var LandChunkModelLoader = require('./landchunkloader').LandChunkModelLoader;
var Overlay = require('./overlay').Overlay;


exports.Application = function(target) {
  this._target = target;  
  this.context = null;
  this.isClient = true;
};

exports.Application.prototype.init = function(finishedCallback){
  var context = new RenderContext();
  context.init(this._target);
  this.go(context);
  finishedCallback();    
};

exports.Application.prototype.go = function(context) {
  var app = this;
  app.context = context;

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

exports.Application.prototype.tick = function(){
  this.controller.tick();  
};

exports.Application.prototype.render = function(){  
   this.rendering.render(this.context);
   this.overlay.render(this.context);
};
