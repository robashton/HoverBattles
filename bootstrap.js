var blah = blah || {};

$app = function(callback){    
    LazyLoad.js([        
        '/game.js',
        '/Shaders.js',
        '/socket.io/socket.io.js'
        ],
        function(){
      Camera = require('camera').Camera;
      ChaseCamera = require('chasecamera').ChaseCamera;
      Clipping = require('clipping').Clipping;
      Controller = require('controller').Controller;
      DefaultModelLoader = require('defaultmodelloader').DefaultModelLoader;
      DefaultTextureLoader = require('defaulttextureloader').DefaultTextureLoader;
      Entity = require('entity').Entity;
      Hovercraft = require('hovercraft').Hovercraft;
      HovercraftController = require('hovercraftcontroller').HovercraftController;
      HovercraftFactory = require('hovercraftfactory').HovercraftFactory;
      LandChunk = require('landchunk').LandChunk;
      LandChunkModelLoader = require('landchunkloader').LandChunkModelLoader;
      LandscapeController = require('landscapecontroller').LandscapeController;
      Model = require('model').Model;          
      RenderContext = require('rendercontext').RenderContext;
      ResourceManager = require('resources').ResourceManager;           
      Scene = require('scene').Scene;           
      Texture = require('texture').Texture;
      ClientCommunication = require('communication').ClientCommunication;
      ParticleEmitter = require('particleemitter').ParticleEmitter;
      CollisionManager = require('collisionmanager').CollisionManager;
      debug = require('debug');
      vec3 = require('../glmatrix').vec3;
      mat3 = require('../glmatrix').mat3;
      quat4 = require('../glmatrix').quat4;
      mat4 = require('../glmatrix').mat4;
      Targeting = require('aiming').Targeting;
      FiringController = require('aiming').FiringController;
      MessageCollection = require('messagecollection').MessageCollection;
      Smoother = require('smoother').Smoother;
      callback();
    });
};

blah.Application = function(target) {
  this._target = target;  
  this.context = null;
  this.isClient = true;
};

blah.Application.prototype.init = function(finishedCallback){
  var context = new RenderContext();
  context.init(this._target);
  this.go(context);
  finishedCallback();    
};

blah.Application.prototype.go = function(context) {
  var app = this;
  app.context = context;
  app.scene = new Scene(this);
  app.resources = new ResourceManager(this);  
  app.resources.setTextureLoader(new DefaultTextureLoader(app));
  app.resources.addModelLoader(new DefaultModelLoader(this.resources));
  app.resources.addModelLoader(new LandChunkModelLoader(this.resources));
  app.controller = new Controller(this.scene);

  var Overlay = require('./overlay').Overlay;
  app.overlay = new Overlay(this);
  app.overlay.activate(context);

  var RenderPipeline = require('renderpipeline').RenderPipeline;

  this.rendering = new RenderPipeline(this);
  this.rendering.init(app.context);

};

blah.Application.prototype.tick = function(){
  this.controller.tick();  
};

blah.Application.prototype.render = function(){  
   this.rendering.render(this.context);
   this.overlay.render(this.context);
};



























