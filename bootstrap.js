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
            callback();
    });
};

blah.Application = function(target) {
  this._target = target;  
  this.context = null;
};

blah.Application.prototype.init = function(finishedCallback){
    var context = new RenderContext();
    context.init(this._target);
    this.go(context);
    finishedCallback();    
};

blah.Application.prototype.go = function(context) {
    this.context = context;
    this.scene = new Scene(this);
    this.resources = new ResourceManager(this);
    
    this.resources.setTextureLoader(new DefaultTextureLoader(app));
    this.resources.addModelLoader(new DefaultModelLoader(this.resources));
    this.resources.addModelLoader(new LandChunkModelLoader(this.resources));
    this.controller = new Controller(this.scene);
    var app = this;
};

blah.Application.prototype.tick = function(){
  this.controller.tick();  
};

blah.Application.prototype.render = function(){
   this.scene.render(this.context);  
};