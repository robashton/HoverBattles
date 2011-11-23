
(function(/*! Stitch !*/) {
  if (!this.require) {
    var modules = {}, cache = {}, require = function(name, root) {
      var module = cache[name], path = expand(root, name), fn;
      if (module) {
        return module;
      } else if (fn = modules[path] || modules[path = expand(path, './index')]) {
        module = {id: name, exports: {}};
        try {
          cache[name] = module.exports;
          fn(module.exports, function(name) {
            return require(name, dirname(path));
          }, module);
          return cache[name] = module.exports;
        } catch (err) {
          delete cache[name];
          throw err;
        }
      } else {
        throw 'module \'' + name + '\' not found';
      }
    }, expand = function(root, name) {
      var results = [], parts, part;
      if (/^\.\.?(\/|$)/.test(name)) {
        parts = [root, name].join('/').split('/');
      } else {
        parts = name.split('/');
      }
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part == '..') {
          results.pop();
        } else if (part != '.' && part != '') {
          results.push(part);
        }
      }
      return results.join('/');
    }, dirname = function(path) {
      return path.split('/').slice(0, -1).join('/');
    };
    this.require = function(name) {
      return require(name, '');
    }
    this.require.define = function(bundle) {
      for (var key in bundle)
        modules[key] = bundle[key];
    };
  }
  return this.require.define;
}).call(this)({"client/application": function(exports, require, module) {var Scene = require('../core/scene').Scene;
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
}, "client/clientgamereceiver": function(exports, require, module) {var Explosion = require('../entities/explosion').Explosion;
var MissileFirer = require('../entities/missilefirer').MissileFirer;
var MissileFactory = require('../entities/missilefactory').MissileFactory;
var HovercraftSpawner = require('../entities/hovercraftspawner').HovercraftSpawner;
var HovercraftFactory = require('../entities/hovercraftfactory').HovercraftFactory;
var ScoreKeeper = require('../entities/scorekeeper').ScoreKeeper;
var ChaseCamera = require('../entities/chasecamera').ChaseCamera;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var TrailsAndExplosions = require('./trailsandexplosions').TrailsAndExplosions;
var ScoreDisplay = require('./scoredisplay').ScoreDisplay;
var Hud = require('./hud').Hud;


exports.ClientGameReceiver = function(app, server) {
  var self = this;

  var app = app;
  var server = server;

  var playerId = null;
  var chaseCamera = null;
  var controller = null;
  var spawner = HovercraftSpawner.Create(app.scene);
  var hovercraftFactory = new HovercraftFactory(app);
  var scoreKeeper = ScoreKeeper.Create(app.scene);
  var scoreDisplay = new ScoreDisplay(app.scene);

  var missileFirer = null;
  var trailsAndExplosions = null;
  var hud = null;

  self._init = function(data) {
	  playerId = data.id;
    createGameComponents();
    initializeHud();
    waitForAssetsToLoad();   
  };
  
  var createGameComponents = function() {
    missileFirer = new MissileFirer(app, new MissileFactory());
    trailsAndExplosions = new TrailsAndExplosions(app);
    chaseCamera = ChaseCamera.Create(app.scene, playerId);
    controller = new HovercraftController(playerId, server);
    scoreDisplay.setPlayerId(playerId);
  };

  var initializeHud = function() {
    hud = Hud.create(app);
    hud.setPlayerId(playerId);
    hud.disable();
  };

  var waitForAssetsToLoad = function() {
	  app.resources.onAllAssetsLoaded(function() {
      sendReadyWithCredentialsToServer();
      hud.enable();
    });
  };

  var sendReadyWithCredentialsToServer = function() {
    var username = $.cookie('username');
    var sign = $.cookie('sign');

    server.sendMessage('ready', {
      username: username,
      sign: sign
    });
  };

  self._noauth = function(data) {
     document.location = 'login.html'; 
  };

  self._syncscene = function(data) {

    // Note: To casual readers, this is NOT how regular syncing works in this application
    // This will get called at least 'once' when the game first fires up, and then when something really
    // major happens on the server. It's a "belt and braces" sync where all entities get all their state effectively
    // refreshed - the real sync is below (and you'll notice that we don't just accept the server values as is, we
    // do rubber banding around the values provided
    // Also, for the most part we rely on event-forwarding to keep state in sync, multiple models all receiving the same input
    // == multiple (mostly) identical models
    for(i in data.others) {
      var serverEntity = data.others[i];
      var clientEntity = app.scene.getEntity(serverEntity.id);

      if(clientEntity)
        clientEntity.setSync(serverEntity.sync);
    }
	  for(i in data.craft) {
		  var serverCraft = data.craft[i];		
		  var clientCraft = app.scene.getEntity(serverCraft.id);

		  if(!clientCraft)
      	 addHovercraftToScene(serverCraft.id, serverCraft.sync);
		  else 
        clientCraft.setSync(serverCraft.sync);      
	  }
    app.scene.broadcastEvent(app.scene, 'fullSyncCompleted', {});
  };

  self._sync = function(data) {
    app.scene.withEntity(data.id, function(entity) {
        entity.setSync(data.sync);
    });
  };

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
	    return craftToAdd;
  };
};

}, "client/communication": function(exports, require, module) {var EntityReceiver = require('../core/entityreceiver').EntityReceiver;
var MessageDispatcher = require('../core/messagedispatcher').MessageDispatcher;
var MissileFactory = require('../entities/missilefactory').MissileFactory;
var ChaseCamera = require('../entities/chasecamera').ChaseCamera;
var HovercraftFactory = require('../entities/hovercraftfactory').HovercraftFactory;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var EventReceiver = require('./eventreceiver').EventReceiver;
var ClientGameReceiver = require('./clientgamereceiver').ClientGameReceiver;

ClientCommunication = function(app){
    this.app = app;
    this.started = false;
    this.socket = io.connect();
    this.hookSocketEvents();
    
    this.dispatcher = new MessageDispatcher();
    this.dispatcher.addReceiver(new ClientGameReceiver(this.app, this)); 
    this.dispatcher.addReceiver(new EntityReceiver(this.app));
    this.dispatcher.addReceiver(new EventReceiver(this.app.scene));
};

ClientCommunication.prototype.hookSocketEvents = function() {
    var game = this;
    this.socket.on('connect', function(){        game.onConnected();     });
    this.socket.on('message', function(msg){     game.dispatchMessage(msg);   });
    this.socket.on('disconnect', function(){     game.onDisconnected(); });    
};

ClientCommunication.prototype.onConnected = function() {

};

ClientCommunication.prototype.onDisconnected = function() {
  alert('Sorry dude, you\'ve been disconnected, try to refresh to rejoin the action');
};

ClientCommunication.prototype.dispatchMessage = function(msg) {
    this.dispatcher.dispatch(msg);
};

ClientCommunication.prototype.sendMessage = function(command, data){
  var msg = { command: command, data: data };
  
  // To ourselves
  this.dispatchMessage(msg);
  
  // To the server
  this.socket.json.send(msg);
};

exports.ClientCommunication = ClientCommunication;
}, "client/eventreceiver": function(exports, require, module) {exports.EventReceiver = function(scene) {
  var self = this;

  self._entityEvent = function(msg) {
    scene.withEntity(msg.id, function(entity) {
      entity.raiseEvent(msg.event, msg.data);
    });
  };
};
}, "client/hovercraftcontroller": function(exports, require, module) {var KeyCodes = {
    S:83,
    X:88, 
    W: 87, 
    D: 68, 
    A: 65, 
    Space: 32,
    RCTRL: 17,
    UP: 38,
    LEFT: 37,
    RIGHT: 39,
    DOWN: 40,
    SHIFT: 16,
    X: 88
};

KeyboardStates = {};

var HovercraftController = function(targetId, server){
  this.targetId = targetId;
  this.server = server;
  
  this.forwards = false;
  this.backward = false;
  this.left = false;
  this.right = false;
  this.jump = false;
  this.enabled = true;
  
  var controller = this;
  setInterval(function() { controller.processInput(); }, 1000 / 30);
  
  this.registerKeyboardMappings();
  
};

HovercraftController.prototype.registerKeyboardMappings = function() {
  this.keyboardMappings = {};
  this.registerKeyboardMapping(KeyCodes.UP, 'startForward', 'cancelForward');
  this.registerKeyboardMapping(KeyCodes.DOWN, 'startBackward', 'cancelBackward');
  this.registerKeyboardMapping(KeyCodes.LEFT, 'startLeft', 'cancelLeft');
  this.registerKeyboardMapping(KeyCodes.RIGHT, 'startRight', 'cancelRight');
  this.registerKeyboardMapping(KeyCodes.Space, 'startUp', 'cancelUp');
  this.registerKeyboardMapping(KeyCodes.X, 'fireRequest', null);
};

HovercraftController.prototype.registerKeyboardMapping = function(code, onKeyboardDown, onKeyboardUp){
  this.keyboardMappings[code] = {
    down: onKeyboardDown,
    up: onKeyboardUp,
    state: false
  };
};

HovercraftController.prototype.disable = function() {
  this.enabled = false;
};

HovercraftController.prototype.enable = function() {
  this.enabled = true;
};

HovercraftController.prototype.processInput = function(){
  if(!this.enabled) return;

  for(var code in this.keyboardMappings){
    var mapping = this.keyboardMappings[code];
    
    if(KeyboardStates[code] && !mapping.state){
      if(mapping.down)
        this.server.sendMessage(mapping.down, { id: this.targetId});
      mapping.state = true;
    }
    else if(!KeyboardStates[code] && mapping.state){
       if(mapping.up)
          this.server.sendMessage(mapping.up, { id: this.targetId});
       mapping.state = false;
    }    
  }    
};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;
    return false;

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
    return false;
};

exports.HovercraftController = HovercraftController;
}, "client/hud": function(exports, require, module) {var Hovercraft = require('../entities/hovercraft').Hovercraft;

var WarningEntity = function(app, controller, sourceid, targetid) {
  var self = this;
  var firedMissileId = null;
  var isLocked = false;
  var currentHudItem = null;
  var index = 0;
  var target = null;
    
  self.notifyHasFired = function(missileid) {
    firedMissileId = missileid;
  };
  
  self.notifyIsLocked = function() {
    isLocked = true;
    clearHud();
    currentHudItem = app.overlay.addItem('warning-' + sourceid, '/data/textures/locked-warner.png');
    updateHudItem();
  };

  self.targetid = function() {
    return targetid;
  };

  self.target = function(sphere) {
    target = sphere;
  };

  self.index = function(value) {
    return index = value !== undefined ? value : index;
  };

  var updateHudItem = function() {
    if(currentHudItem) {
      currentHudItem.top(target.centre[1] + target.radius / 2.0);
      currentHudItem.left(index * 16 + target.centre[0] - target.radius / 2.0);
      currentHudItem.width(16);
      currentHudItem.height(16);
    }
  };

  self.tick = function() {
    updateHudItem();
  };
  
  var clearHud =  function() {
    if(currentHudItem)
      app.overlay.removeItem(currentHudItem);
  };

  self.dispose = function() {
    clearHud();
    controller.notifyRemovalOfItem(self);
  };

  currentHudItem = app.overlay.addItem('warning-' + sourceid, '/data/textures/aiming-warner.png');
  controller.notifyCreationOfItem(self);
  updateHudItem();
};


var WarningsContainer = function(app, playerId) {
  var self = this;
  var items = [];
  var lastSphere = null;
   
  self.notifyCreationOfItem = function(item) {
     items.push(item);
     updateIndexes(); 
     item.target(lastSphere);
  };

  self.notifyRemovalOfItem = function(item) {
    var newItems = [];
    for(var i = 0; i < items.length; i++)
      if(items[i] !== item) newItems.push(items[i]);
    items = newItems;
    updateIndexes();
  };

  var updateIndexes = function() {
    for(var i = 0; i < items.length; i++)
      items[i].index(i);
  };

  self.tick = function() {
    var scene = app.scene;
    var camera = scene.camera;

    var entity = scene.getEntity(playerId);
    if(entity) {
      var worldSphere = entity.getSphere();
      lastSphere = camera.transformSphereToScreen(worldSphere);
      for(var i = 0; i < items.length; i++)
        items[i].target(lastSphere);
    }
  };
};

var TargettingEntity = function(app, sourceid, targetid) {
  var self = this;
  var scene = scene;
  var sourceid = sourceid;
  var targetid = targetid;
  var firedMissileId = null;
  var isLocked = false;
  var hudItem = null;
  var textItem = null;
  var rotation = 0;
  var isPlayer = isPlayer;

  self.notifyHasFired = function(missileid) {
    firedMissileId = missileid;
  };
  
  self.notifyIsLocked = function() {
    isLocked = true;
    app.overlay.removeItem(hudItem);
    hudItem = app.overlay.addItem('lock-' + sourceid, '/data/textures/locked.png');
    self.tick();
  };

  self.targetid = function() {
    return targetid;
  };
  
  self.dispose = function() {
    if(hudItem)
       app.overlay.removeItem(hudItem);
    if(textItem)
       app.overlay.removeItem(textItem);
  };

  self.tick = function() {
   app.scene.withEntity(targetid, function(entity) {    
      var camera = app.scene.camera;

      var worldSphere = entity.getSphere();
      var transformedSphere = camera.transformSphereToScreen(worldSphere);

      var radius = transformedSphere.radius;
      var centre = transformedSphere.centre;
    
      var min = [centre[0] - radius, centre[1] - radius];
      var max = [centre[0] + radius, centre[1] + radius];

      hudItem.left(min[0]);
      hudItem.top(min[1]);
      hudItem.width(max[0] - min[0]);
      hudItem.height(max[1] - min[1]);   
      hudItem.rotation(rotation += 0.03);

      var textLeft = min[0] + (max[0] - min[0]) + 5.0;
      var textTop = min[1] - 48;

      textItem.left(textLeft);
      textItem.top(textTop);
      textItem.width(128);
      textItem.height(128);   
    });
  };

  app.scene.withEntity(targetid, function(entity) {    
    hudItem = app.overlay.addItem('track-' + sourceid, '/data/textures/targeting.png');
    textItem = app.overlay.addTextItem('text-' + sourceid, entity.displayName(), 128, 128, 'red', 'bold 14px verdana');
  });

  self.enable = function() {
     hudItem.show();
     textItem.show();
  };

  self.disable = function() {
     hudItem.hide();
     textItem.hide();
  };
  
  self.tick();  
};

var OtherPlayer = function(app, entity) {
   var self = this;
   var hudItem = null;
   var enabled = true;

   self.dispose = function() {
    if(hudItem)
      app.overlay.removeItem(hudItem);
   };   
 
  var hudItem = app.overlay.addItem('indicator-' + entity.getId(), '/data/textures/indicator.png');
    
  self.update = function() {
    var camera = app.scene.camera;

    var worldSphere = entity.getSphere();
    var transformedSphere = camera.transformSphereToScreen(worldSphere);

    var centre = transformedSphere.centre;
    var radius = transformedSphere.radius;

    if(centre[2] < 100.0 || !enabled)
      hudItem.hide();
    else
      hudItem.show();
 
    var position = [centre[0] - 4.0, centre[1] - (radius * 2.0)];

    hudItem.left(position[0]);
    hudItem.top(position[1]);
    hudItem.width(8.0);
    hudItem.height(8.0);   
  };

  self.enable = function() {
     enabled = true;
  };

  self.disable = function() {
    enabled = false;
  };
};


exports.Hud = function(app) {
  var self = this;
  var app = app;
  var playerId = null;
  var warnings = null;
  var enabled = true;

  var trackedCraft = {};
  var playerIndicators = {};

  self.setPlayerId = function(id) {
    playerId = id;
    warnings = new WarningsContainer(app, playerId);
  };

  var onEntityAdded = function(entity) {
    if(entity.is(Hovercraft))
      hookHovercraftEvents(entity);
  };

  var onEntityRemoved = function(entity) {
    if(entity.is(Hovercraft))
      unHookHovercraftEvents(entity);
  };

  var hookHovercraftEvents = function(craft) {
    if(craft.getId() !== playerId) {
      createPlayerIndicator(craft);
    }
  };

  var createPlayerIndicator = function(craft) {
    var id = craft.getId();
    playerIndicators[id] = new OtherPlayer(app, craft);
    if(!enabled) playerIndicators[id].disable();
  };

  var unHookHovercraftEvents = function(craft) {
    clearAllKnowledgeOfHovercraft(craft.getId());
  };

  var onEntityTrackingTarget = function(data) {
    createTrackedHovercraft(this.getId(), data.target.getId());
  };

  var onEntityCancelledTrackingTarget = function(data) {
    clearTrackedHovercraft(this.getId());
  };

  var onEntityMissileLock = function(data) {
    withTrackedEntity(this.getId(), function(trackedEntity) {
      trackedEntity.notifyIsLocked();
    });
  };

  var onEntityFireMissile = function(data) {
    withTrackedEntity(this.getId(), function(trackedEntity) {
      trackedEntity.notifyHasFired(data.missileid);
    });
  };

  var onEntityHealthZeroed = function(data) {
    withTrackedEntity(this.getId(), function(trackedEntity) {       
      clearTrackedHovercraft(data.sourceid);
    });
  };

 var createTrackedHovercraft = function(sourceid, targetid) {
   if(sourceid === playerId) {
      trackedCraft[sourceid] = new TargettingEntity(app, sourceid, targetid);
      
    } else if(targetid === playerId){ 
      trackedCraft[sourceid] = new WarningEntity(app, warnings, sourceid, targetid);
    }
    if(trackedCraft[sourceid] && !enabled)
      trackedCraft[sourceid].disable();
  };

  var clearTrackedHovercraft = function(sourceid) {
    var entity = trackedCraft[sourceid];

    if(entity) {
      delete trackedCraft[sourceid];
      entity.dispose();
    }
  };

  var clearIndicators = function(sourceid) {
    if(sourceid === playerId) return;
    var indicator = playerIndicators[sourceid];
    delete playerIndicators[sourceid];
    indicator.dispose();
  };

  var clearPlayerTargetIfNecessary = function(sourceid) {
    if(trackedCraft[playerId] && trackedCraft[playerId].targetid() === sourceid)
      clearTrackedHovercraft(playerId);
  };

  var clearAllKnowledgeOfHovercraft = function(sourceid) {
    clearTrackedHovercraft(sourceid);
    clearIndicators(sourceid);
    clearPlayerTargetIfNecessary(sourceid);

    for(i in trackedCraft)
      if(trackedCraft[i].targetid() === sourceid) 
        clearTrackedHovercraft(i);    
  };

  var withTrackedEntity = function(sourceid, callback) {
    if(trackedCraft[sourceid])
      callback(trackedCraft[sourceid]);
  };

  self.enable = function() {
    enabled = true;
    for(var i in trackedCraft)
      trackedCraft[i].enable();
    for(var i in playerIndicators)
      playerIndicators[i].enable();
  };

  self.disable = function() {
    enabled = false;
    for(var i in trackedCraft)
      trackedCraft[i].disable();
    for(var i in playerIndicators)
      playerIndicators[i].disable();
  };

  self.doLogic = function() {
    if(warnings) warnings.tick();
    for(var i in trackedCraft) {
      var entity = trackedCraft[i];
      entity.tick();
    }
    for(var i in playerIndicators)
      playerIndicators[i].update();
  };

  app.scene.on('trackingTarget', onEntityTrackingTarget);
  app.scene.on('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  app.scene.on('missileLock', onEntityMissileLock);
  app.scene.on('fireMissile', onEntityFireMissile);
  app.scene.on('healthZeroed', onEntityHealthZeroed);
  app.scene.onEntityAdded(onEntityAdded);
  app.scene.onEntityRemoved(onEntityRemoved);
};

exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
  return hudEntity;
};



}, "client/keyboard": function(exports, require, module) {
exports.KeyboardStates = KeyboardStates;}, "client/landchunkloader": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4
var LandChunk = require('../entities/landchunk').LandChunk;

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
  
  var model = new LandChunk(data.width, data.height, data.maxHeight, data.scale, data.x, data.y);
  model.loadTextures(this._resources);
  
  var loader = this;

  $.getJSON(url, function(data, err) {
      model.setData(data);
      callback();
  });
  
  return model;
};

exports.LandChunkModelLoader = LandChunkModelLoader;
}, "client/loader": function(exports, require, module) {}, "client/overlay": function(exports, require, module) {var mat4 = require('../thirdparty/glmatrix').mat4;

var OverlayItem = function(id, texture) {
  var self = this;
  var id = id;
  var texture = texture;
  var width = 100;
  var height = 100;
  var top = 0;
  var left = 0;
  var rotation = 0;
  var visible = true;

  self.id = function() {
    return id;
  };

  self.show = function() {
    visible = true;
  };

  self.hide = function() {
    visible = false;
  };

  self.top = function(value) {
    return top = value || top;
  }; 

  self.left = function(value) {
    return left = value || left;
  };

  self.width = function(value) {
    return width = value || width;
  };

  self.height = function(value) {
    return height = value || height;
  };  

  self.isVisible = function() {
    return visible;
  };

  self.texture = function() {
    return texture.get();
  };

  self.rotation = function(value) {
    return rotation = value || rotation;
  };
};

exports.Overlay = function(app) {
  var self = this;
  var app = app;
  var vertexBuffer = null;
  var quadTextureBuffer = null;
  var items = {};

  var quadVertices =  [
         0.0,  0.0,  0.0,
         1.0,  0.0,  0.0,
         0.0,  1.0,  0.0,
         1.0,  1.0,  0.0
    ];

  var quadTextureCoords =  [
         0.0,  1.0, 
         1.0,  1.0,
         0.0,  0.0,
         1.0,  0.0,
    ];

  self.addItem = function(id, texture) {
    var item = null; 
    if(typeof(texture) === 'string')      
      item = new OverlayItem(id, app.resources.getTexture(texture));
    else 
      item = new OverlayItem(id, { get: function() { return texture; } });

    items[id] = item;
    return item;
  };

  self.removeItem = function(item) {
    if(item.cleanup) item.cleanup();
    delete items[item.id()];
  };

  self.addTextItem = function(id, text, width, height, colour, font) {
    var textCanvas  = document.getElementById('scratch');
    var textContext = textCanvas.getContext("2d");

    textCanvas.width = width || 128;
    textCanvas.height = height || 128;
    textContext.fillStyle = colour || 'white';
    textContext.font = font || "bold 12px sans-serif";
    textContext.fillText(text, 0, height / 2.0);

    var gl = app.context.gl;
    var texture = gl.createTexture();              
    gl.bindTexture(gl.TEXTURE_2D, texture);

    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, textCanvas);           
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);                 
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    var item = this.addItem(id, texture);
    item.width(width || 128);
    item.height(height || 128);
    item.cleanup = function() {
      gl.deleteTexture(texture);
    };
    return item;
  };

  self.activate = function(context) {
    var gl = context.gl;

	  vertexBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

	  quadTextureBuffer = gl.createBuffer();
	  gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadTextureCoords), gl.STATIC_DRAW);
  };

  self.deactivate = function(context) {
    gl.destroyBuffer(vertexBuffer);
  };

  self.render = function(context) {
    var gl = context.gl;   
    var program = context.setActiveProgram("hud"); 

    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);  

    var projectionMatrix = mat4.ortho(0, context.currentWidth(), context.currentHeight(), 0, -1, 1);
    var viewMatrix = mat4.lookAt([0,0,0], [0,0,-1], [0,1,0]);

    // Upload the quad
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    
    // And the texture coords
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));

    // Set the orthographic projection setup
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);

    for(var i in items) {
      var item = items[i];
      if(!item.isVisible()) continue;

      var worldMatrix = mat4.create();
      mat4.identity(worldMatrix);

      mat4.translate(worldMatrix, [item.left() + (0.5 * item.width()), item.top() + (0.5 * item.height()), 0.0]);
      mat4.rotateZ(worldMatrix, item.rotation());
      mat4.translate(worldMatrix, [-(0.5 * item.width()), -(0.5 * item.height()), 0.0]);
      mat4.scale(worldMatrix, [item.width(), item.height() , 1.0]);
      
      gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
      
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, item.texture());
      gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);  

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
       
    }

    gl.disable(gl.BLEND);
    gl.depthMask(true);

  }; 

};
}, "client/scoredisplay": function(exports, require, module) {var ScoreKeeper = require('../entities/scorekeeper').ScoreKeeper;

exports.ScoreDisplay = function(scene) {
  var self = this;

 var updateView = function() {
    var scoreKeeper = ScoreKeeper.GetFrom(scene);
    var scores = scoreKeeper.getScores();
    GlobalViewModel.setScores(scores);
  };

  self.setPlayerId = function(id) {
    GlobalViewModel.setPlayerId(id);
  };

  scene.on('fullSyncCompleted', updateView);
  scene.on('playerScoreChanged', updateView);
  scene.on('playerJoined', updateView);
  scene.on('playerLeft', updateView);
};
}, "client/trailsandexplosions": function(exports, require, module) {var Missile = require('../entities/missile').Missile;
var Hovercraft  = require('../entities/hovercraft').Hovercraft;
var ParticleEmitter = require('../entities/particleemitter').ParticleEmitter;

exports.TrailsAndExplosions = function(app) {
  var self = this;
  var trails = {};

  var onEntityAdded = function(entity) {
    if(entity.is(Hovercraft))
      setupEntityTrail(entity, createHovercraftTrail);
    else if(entity.is(Missile))
      setupEntityTrail(entity, createMissileTrail);
  };

  var onEntityRemoved = function(entity) {
    if(entity.is(Hovercraft) || entity.is(Missile))
      removeEntityTrail(entity);
  };

  var setupEntityTrail = function(entity, trailFactory) {
    var id = entity.getId();
    var trail = trailFactory(id + 'trail', entity);
    trails[id] = trail;
    app.scene.addEntity(trail);
  };

  var removeEntityTrail = function(entity) {
    var id = entity.getId();
    var trail = trails[id];
    app.scene.removeEntity(trail);
    delete trails[id];
  };

  var createMissileTrail = function(id, missile) {
    return new ParticleEmitter(id, 4000, app,
    {
        maxsize: 100,
        maxlifetime: 0.2,
        rate: 500,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        textureName: '/data/textures/missile.png',
        track: function(){
            this.position = vec3.create(missile.position);
        }
    });
  };

  var createHovercraftTrail = function(id, hovercraft) {
    return new ParticleEmitter(id, 100, app,
    {
        maxsize: 50,
        maxlifetime: 0.3,
        rate: 20,
        scatter: vec3.create([1.2, 0.001, 1.2]),
        particleOutwardVelocityMin: vec3.create([-0.9,-50.0,-0.9]),
        particleOutwardVelocityMax: vec3.create([0.9, -4.0,0.9]),
        track: function(){
            this.position = vec3.create([hovercraft.position[0], hovercraft.position[1] - 0.3 , hovercraft.position[2]]);
        },
        textureName: '/data/textures/trail.png'
    });
  };

  app.scene.onEntityAdded(onEntityAdded);
  app.scene.onEntityRemoved(onEntityRemoved);     
};
}, "core/bounding": function(exports, require, module) {vec3 = require('../thirdparty/glmatrix').vec3;
mat4 = require('../thirdparty/glmatrix').mat4;

var Sphere = function(radius, centre) {
  this.radius = radius;
  this.centre = centre;
};

var Box = function(min, max) {
    this.min = min;
    this.max = max;
};

Sphere.Create = function(vertices, box) {
   var centre = vec3.create([0,0,0]);
   centre[0] = (box.min[0] + box.max[0]) / 2.0;
   centre[1] = (box.min[1] + box.max[1]) / 2.0;
   centre[2] = (box.min[2] + box.max[2]) / 2.0;
   
   var radiusSquared = 0.0;
   
  for(var i = 0 ; i < vertices.length / 3 ; i++){
    var index = i * 3;
    var difference = 
        [   vertices[index] - centre[0], 
            vertices[index+1] - centre[1],
            vertices[index+2] - centre[2]
        ];
    var magnitudeSquared =  difference[0] * difference[0] + 
                            difference[1] * difference[1] +
                            difference[2] * difference[2];
                            
    if(radiusSquared < magnitudeSquared) radiusSquared = magnitudeSquared;
  }   
    
  return new Sphere(Math.sqrt(radiusSquared), centre);    
};


Sphere.prototype.intersectSphere = function(other) {
    var totalRadius = other.radius + this.radius;
    var difference = vec3.create([0,0,0]);    
    vec3.subtract(other.centre, this.centre, difference);    
    var distanceBetweenSpheres = vec3.length(difference);
                            
    return {
        distance: distanceBetweenSpheres - totalRadius,
        direction: vec3.normalize(difference)
    };
};

Sphere.prototype.translate = function(vector) {
   var newCentre = vec3.create([0,0,0]);
   newCentre[0] = this.centre[0] + vector[0];
   newCentre[1] = this.centre[1] + vector[1];
   newCentre[2] = this.centre[2] + vector[2];   
   return new Sphere(this.radius, newCentre);   
};


Box.Create = function(vertices) {   
    var min = vec3.create([999,999,999]);
    var max = vec3.create([-999,-999,-999]);
   for(var i = 0 ; i < vertices.length / 3 ; i++){
       var index = i * 3;
       
       min[0] = Math.min(vertices[index], min[0]);
       min[1] = Math.min(vertices[index+1], min[1]);
       min[2] = Math.min(vertices[index+2], min[2]);
       
       max[0] = Math.max(vertices[index], max[0]);
       max[1] = Math.max(vertices[index+1], max[1]);
       max[2] = Math.max(vertices[index+2], max[2]);       
   }   
  return new Box(min, max);  
};

Box.prototype.transform = function(matrix) {
  var a, b, i, j;
  var aMin = vec3.create([0,0,0]);
  var aMax = vec3.create([0,0,0]);
  var bMin = vec3.create([0,0,0]);
  var bMax = vec3.create([0,0,0]);

  
  
  
};

exports.Box = Box;
exports.Sphere = Sphere;
}, "core/camera": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var vec4 = require('../thirdparty/glmatrix').vec4;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Frustum = require('./frustum').Frustum;
var Sphere = require('./bounding').Sphere;

var Camera = function(location) {
    this.location = location || vec3.create();
    this.lookAt = vec3.create();
    this.width = 800;
    this.height = 600;
    this.up = vec3.create([0,1,0]);
    this.projMatrix = mat4.create();
    this.viewMatrix = mat4.create();
};

Camera.prototype.setLocation = function(location) {
	this.location = location;
};

Camera.prototype.updateMatrices = function(){
	  mat4.perspective(45, this.width / this.height, 1.0, 5000.0, this.projMatrix);
    mat4.lookAt(this.location, this.lookAt, this.up, this.viewMatrix); 
    this.frustum = new Frustum(this.projMatrix);
    this.frustum.setTransform(this.viewMatrix);
};

Camera.prototype.getProjectionMatrix = function() {
    return this.projMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    return this.viewMatrix;
};

Camera.prototype.transformSphereToScreen = function(sphere) {
  var difference = vec3.create([0,0,0]);
  vec3.subtract(this.location, sphere.centre, difference);
  var distance = vec3.length(difference);

  var radius = Math.atan(sphere.radius / distance);
  radius *= (this.width / (45 * Math.PI / 360.0));

  var transformMatrix = mat4.create();
  mat4.multiply(this.projMatrix, this.viewMatrix, transformMatrix);

  var centre = [sphere.centre[0], sphere.centre[1], sphere.centre[2], 1.0];
  mat4.multiplyVec4(this.viewMatrix, centre);
  mat4.multiplyVec4(this.projMatrix, centre);
  vec3.scale(centre, 1.0 / centre[3]);
  
  var halfWidth = this.width / 2.0;
  var halfHeight = this.height / 2.0;
    
  centre[0] = centre[0] * halfWidth + halfWidth;
  centre[1] = -centre[1] * halfHeight + halfHeight;
  centre[2] = centre[3];
  return new Sphere(radius / 2.0, centre);
};

exports.Camera = Camera;
}, "core/collisionmanager": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;

CollisionManager = function(){
    
};

CollisionManager.prototype.processPair = function(entityOne, entityTwo) {
  if(entityOne._velocity == null || entityTwo._velocity == null) { return; }
  if(entityOne.position == null || entityTwo.position == null) { return; }
  if(!entityOne.getSphere || !entityTwo.getSphere) return;

  var sphereOne = entityOne.getSphere();
  var sphereTwo = entityTwo.getSphere();
  
  var results = sphereOne.intersectSphere(sphereTwo);
  
  if(results.distance > 0) return;

  var distanceToMoveEntityOne = vec3.create([0,0,0]);
  var distanceToMoveEntityTwo = vec3.create([0,0,0]);
  
  vec3.scale(results.direction, (results.distance / 2.0), distanceToMoveEntityOne);
  vec3.scale(results.direction, -(results.distance / 2.0), distanceToMoveEntityTwo);
    
  vec3.add(entityOne.position, distanceToMoveEntityOne);
  vec3.add(entityTwo.position, distanceToMoveEntityTwo);

};


exports.CollisionManager = CollisionManager;
}, "core/controller": function(exports, require, module) {var Controller = function(scene) {
  this.scene = scene;
  this._timeAtLastFrame = new Date().getTime();
  this._idealTimePerFrame = 1000 / 30;
  this._leftover = 0.0;
  this._first = true;
};

Controller.prototype.tick = function(){
    var timeAtThisFrame = new Date().getTime();
    var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
    if(this._first) { catchUpFrameCount = 1; timeSinceLastDoLogic = this._idealTimePerFrame; this._first = false; }
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this.scene.doLogic();
	}
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;  
};

exports.Controller = Controller;}, "core/debug": function(exports, require, module) {exports = {
    
    
};}, "core/defaultmodelloader": function(exports, require, module) {var Model = require('./model').Model;

var DefaultModelLoader = function(resources){
    this._resources = resources;
};

DefaultModelLoader.prototype.handles = function(path){
  return path.indexOf('.json') > -1;  
};

DefaultModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 5);
    var loader = this;
    
    $.getJSON('/data/models/' + path, function(data) {
      data.texture =  loader._resources.getTexture("/data/textures/" + name + ".jpg");
      model.setData(data);
         callback();      
    });
        
    return model;
};

exports.DefaultModelLoader = DefaultModelLoader;}, "core/defaulttextureloader": function(exports, require, module) {var Texture = require('./texture').Texture;

var DefaultTextureLoader = function(app){
    this._app = app;  
};

DefaultTextureLoader.prototype.load = function(path, callback) {

  var image = new Image();
  image.onload = function(){
    callback();  
  };
  
  image.src = path;
  var texture = new Texture(path, image);
  return texture; 
};

exports.DefaultTextureLoader = DefaultTextureLoader;
}, "core/entity": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var mat3 = require('../thirdparty/glmatrix').mat3;

var Entity = function(id){
  var self = this;
  self._model = null;
	self._id = id;
	self.position = vec3.create([0,0,0]);
  self.rotationY = 0;
	self._scene = null;
	self.eventHandlers = {};
  self.components = [];

  var eventQueue = [];
  var eventCount = 0;

  self.getId = function(){
	  return self._id;
  };

  self.setModel = function(model) {
     self._model = model;  
  };

  self.getModel = function(){
	  return self._model;
  };

  self.addEventHandler = function(eventName, callback) {
	  if(!self.eventHandlers[eventName])
		  self.eventHandlers[eventName] = [];
	  self.eventHandlers[eventName].push(callback);
  };

  self.removeEventHandler = function(eventName, callback) {
	  if(!self.eventHandlers[eventName])
		  self.eventHandlers[eventName] = [];

    var newItems = [];
    for(var i = 0; i < self.eventHandlers[eventName].length; i++)
        if(self.eventHandlers[eventName][i] !== callback) 
          newItems.push(self.eventHandlers[eventName][i]);
    
    self.eventHandlers[eventName] = newItems;
  };

  self.raiseServerEvent = function(eventName, data) {
	  if(self._scene.app.isClient) return;
    self.raiseEvent(eventName, data);
  };

  self.raiseEvent = function(eventName, data) {
    eventQueue.push({
      name: eventName,
      data: data
    });

   eventCount++;
   sendEventToInternalListeners(eventName, data);
   eventCount--;
   
   // Ensure that events are published in the order that we processed them internally
   if(eventCount === 0) {
      var queue = eventQueue;
      eventQueue = [];
      publishEventQueue(queue);
   }
  };

  var publishEventQueue = function(queue) {
    for(var i = 0; i < queue.length; i++)
      self._scene.broadcastEvent(self, queue[i].name, queue[i].data);
  };

  var sendEventToInternalListeners = function(eventName, data) {
	  if(!self.eventHandlers[eventName]) return;
	  for(var x = 0 ; x < self.eventHandlers[eventName].length; x++){
		  var handler = self.eventHandlers[eventName][x];
		  handler.call(self, data);
	  }
  };  

  self.attach = function(component, args) {
    self.components.push(component);

    var oldProperties = {};
    for(var i in this) {
      oldProperties[i] = this[i];
    }

    if(!component.apply){
      console.warn("Cannot apply component, it's written in the old style");
      return;
    }

    component.apply(this, args);

    // Note: We've ended up here because of the natural evolution of 
    // how these components have traditionally worked
    // clearly this code is sub-optimal, and it'll get fixed next time
    // these entities become painful to deal with (just like how this happened
    // last time these entities became painful to deal with)
    for(var i in this) {
      if(oldProperties[i] && oldProperties[i] !== this[i]) {
         if(i === 'doLogic') {
            var newLogic = this[i];
            var oldLogic = oldProperties[i];
            self.doLogic = function() {
              oldLogic.call(this);
              newLogic.call(this);
            }
         }
         else if(i === 'updateSync') {
            var newSendSync = this[i];
            var oldSendSync = oldProperties[i];
            self.updateSync = function(sync) {
              newSendSync.call(this, sync);
              oldSendSync.call(this, sync);
            };
         }
         else if(i === 'setSync') {
            var newRecvSync = this[i];
            var oldRecvSync = oldProperties[i];
            self.setSync = function(sync) {
              newRecvSync.call(this, sync);
              oldRecvSync.call(this, sync);
            };
         } else {
          console.warn("Detected a potentially unacceptable overwrite of " + i + 'on ' + this.getId());
        }
      }
    }
  };

  self.sendMessage = function(msg, data) {
    var functionName = msg;
    if(this[functionName])
      this[functionName](data);
  };

  self.doLogic = function() {

  };

  self.setScene = function(scene) {
	  self._scene = scene;
  };

  self.getSync = function() {
    var sync = {};
    self.updateSync(sync);
    return sync;
  };

  self.is = function(component) {
    for(var x = 0; x < self.components.length; x++) {
      // Hack: To get around stitch and its dodgy caching
      if(self.components[x].toString() === component.toString()) return true;
    }
    return false;
  };

  self.updateSync = function(sync) {

  };

  self.setSync = function(sync) {

  };

  self.render = function(context){
    if(!self._model) { return; }
	  var gl = context.gl;

	  var viewMatrix = self._scene.camera.getViewMatrix();
	  var projectionMatrix = self._scene.camera.getProjectionMatrix();
      
	  var worldMatrix = mat4.create();
      mat4.identity(worldMatrix);
      mat4.translate(worldMatrix, this.position);
      mat4.rotateY(worldMatrix, this.rotationY);
      
      var modelViewMatrix = mat4.create();
      mat4.multiply(viewMatrix, worldMatrix, modelViewMatrix);
      
      var normalMatrix = mat3.create();
      mat3.identity(normalMatrix);
      mat4.toInverseMat3(modelViewMatrix, normalMatrix);
      mat3.transpose(normalMatrix);
      
	    var program = context.setActiveProgram(self._model.getProgram());
        
	    self._model.upload(context);

	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
      gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);

	    self._model.render(context);
  };
};

exports.Entity = Entity;
}, "core/entityreceiver": function(exports, require, module) {EntityReceiver = function(app) {
    this.app = app;
};

EntityReceiver.prototype.withEntity = function(id, callback) {
  var entity = this.getEntity(id);
  if(!entity) return;
  callback(entity);
};

EntityReceiver.prototype._startUp = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startUp();
    });
};

EntityReceiver.prototype._cancelUp = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelUp();
    });
};

EntityReceiver.prototype._startForward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startForward();
    });
};

EntityReceiver.prototype._cancelForward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelForward();
    });
};

EntityReceiver.prototype._startBackward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startBackward();
    });
};

EntityReceiver.prototype._cancelBackward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelBackward();
    });
};

EntityReceiver.prototype._startLeft = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startLeft();
    });
};

EntityReceiver.prototype._cancelLeft = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelLeft();
    });
 };

EntityReceiver.prototype._startRight = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startRight();
    });
};

EntityReceiver.prototype._cancelRight = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelRight();
    });
};

EntityReceiver.prototype.getEntity = function(id) {
  return this.app.scene.getEntity(id);
};

exports.EntityReceiver = EntityReceiver;
}, "core/eventcontainer": function(exports, require, module) {exports.EventContainer = function() {
  var self = this;
  var handlers = [];

  self.raise = function(source, data) {
    for(var i = 0; i < handlers.length; i++)
      handlers[i].call(source, data);
  };
 
  self.add = function(handler) {
    handlers.push(handler);
  };

  self.remove = function(handler) {
    var newItems = [];
    for(var i = 0; i < handlers.length; i++)
        if(handlers[i] !== callback) 
          newItems.push(handlers[i]);
    handlers = newItems;
  };
};
}, "core/frustum": function(exports, require, module) {mat4 = require('../thirdparty/glmatrix').mat4;
debug = require('./debug');

var Frustum = function(projectionMatrix) {   
 this.projection = projectionMatrix;
 this.transform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
 mat4.identity(this.transform);
 
 this.planes = {       
     left: [0,0,0,0],
     right: [0,0,0,0],
     top: [0,0,0,0],
     bottom: [0,0,0,0],
     near: [0,0,0,0],
     far: [0,0,0,0]    
 };
 
 this.extractPlanes();
};

Frustum.Create = function(left, right, top, bottom, near, far){
  var projection =   mat4.frustum(left, right, bottom,top, near, far);
  return new Frustum(projection);
};

Frustum.prototype.setTransform = function(transform) {
  this.transform = transform;
  this.extractPlanes();
};

Frustum.prototype.extractPlanes = function() {
    var transformedMatrix = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
    mat4.multiply(this.projection, this.transform,transformedMatrix);
    
    
    // Left plane
    this.planes.left[0] = transformedMatrix[3] + transformedMatrix[0];
    this.planes.left[1] = transformedMatrix[7] + transformedMatrix[4];
    this.planes.left[2] = transformedMatrix[11] + transformedMatrix[8];
    this.planes.left[3] = transformedMatrix[15] + transformedMatrix[12];
 
    // Right plane
    this.planes.right[0] = transformedMatrix[3] - transformedMatrix[0];
    this.planes.right[1] = transformedMatrix[7] - transformedMatrix[4];
    this.planes.right[2] = transformedMatrix[11] - transformedMatrix[8];
    this.planes.right[3] = transformedMatrix[15] - transformedMatrix[12];
 
    // Top plane
    this.planes.top[0] = transformedMatrix[3] - transformedMatrix[1];
    this.planes.top[1] = transformedMatrix[7] - transformedMatrix[5];
    this.planes.top[2] = transformedMatrix[11] - transformedMatrix[9];
    this.planes.top[3] = transformedMatrix[15] - transformedMatrix[13];
 
    // Bottom plane
    this.planes.bottom[0] = transformedMatrix[3] + transformedMatrix[1];
    this.planes.bottom[1] = transformedMatrix[7] + transformedMatrix[5];
    this.planes.bottom[2] = transformedMatrix[11] + transformedMatrix[9];
    this.planes.bottom[3] = transformedMatrix[15] + transformedMatrix[13];
 
    // Near plane
    this.planes.near[0] = transformedMatrix[3] + transformedMatrix[2];
    this.planes.near[1] = transformedMatrix[7] + transformedMatrix[6];
    this.planes.near[2] = transformedMatrix[11] + transformedMatrix[10];
    this.planes.near[3] = transformedMatrix[15] + transformedMatrix[14];
 
    // Far plane
    this.planes.far[0] = transformedMatrix[3] - transformedMatrix[2];
    this.planes.far[1] = transformedMatrix[7] - transformedMatrix[6];
    this.planes.far[2] = transformedMatrix[11] - transformedMatrix[10];
    this.planes.far[3] = transformedMatrix[15] - transformedMatrix[14];
    
    for(i in this.planes){
        var plane = this.planes[i];
        var length = vec3.length(plane);
        plane[0] /= length;
        plane[1] /= length;
        plane[2] /= length;
        plane[3] /= length;     
    }
};

Frustum.prototype.intersectSphere = function(sphere) {
    for(i in this.planes){
        var plane = this.planes[i];        
        var distance =  plane[0] * sphere.centre[0] +
                        plane[1] * sphere.centre[1] + 
                        plane[2] * sphere.centre[2] +
                        plane[3];
                        
      if(distance <= -sphere.radius) return false;
    }
    return true;
};

exports.Frustum = Frustum;
}, "core/messagecollection": function(exports, require, module) {var MessageCollection = function() {
	this.inner = [];
};

MessageCollection.prototype.add = function(messageName, data) {
	this.inner.push({
		messageName: messageName,
		data: data
	});
};

MessageCollection.prototype.hasMessage = function(messageName, expectedData) {
	for(var x = 0 ; x < this.inner.length; x++){
		var msg = this.inner[x];
		if(msg.messageName != messageName) continue;
		for(var key in expectedData) {
			if(msg.data[key] !== expectedData[key])
			return false;
		}
		return true;
	}
	return false;	
};

exports.MessageCollection = MessageCollection;}, "core/messagedispatcher": function(exports, require, module) {MessageDispatcher = function() {
  this.routeTable = {};
  this.receivers = [];
};

MessageDispatcher.prototype.addReceiver = function(receiver){
    for(var i in receiver){
     if(i.indexOf('_') !== 0) continue;
		var messageName = i.substr(1);
		
		if(!this.routeTable[messageName])
			this.routeTable[messageName] = [];

        this.routeTable[messageName].push(receiver);     
    }
};

MessageDispatcher.prototype.dispatch = function(message) {
  var receiverCollection = this.routeTable[message.command];
  if(!receiverCollection){
   console.log('Receiver not found for message: ' + message.command);
   return;
  }
  var length = receiverCollection.length;
  for(var i = 0; i < length; i++) {
	var receiver = receiverCollection[i];
    var method = receiver['_' + message.command];
    method.call(receiver, message.data);	
  }
};

exports.MessageDispatcher = MessageDispatcher;}, "core/model": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var bounding = require('./bounding');


var Model = function(data){
  this._programName = "default";
  this._hasData = false;
 
  if(data) { this.setData(data); }
  this._vertexBuffer = null;
  this._indexBuffer = null;
  this._colourBuffer = null;
  this._textureBuffer = null;
  this._normalBuffer = null;

  this.boundingSphere = new bounding.Sphere(0.0, [0,0,0]);
};

Model.prototype.setData = function(data) {
  this._vertices = data.vertices;
  this._colours = data.colours;
  this._indices = data.indices;
  this._texCoords = data.texCoords;
  this._normals = data.normals;
  this._texture = data.texture;
  
  if(data.sphere){
      this.boundingSphere = new bounding.Sphere(data.sphere.radius, data.sphere.centre);
  }
  this._hasData = true;
  if(this._texCoords) { this._programName = "texture"; }
  else if( this._colours ) { this._programName = "colour"; }
};

Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.activate = function(context) {
	var gl = context.gl;

	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._vertices), gl.STATIC_DRAW)

	if(this._colours) {
		this._colourBuffer = gl.createBuffer();
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._colours), gl.STATIC_DRAW)
	}
  if(this._texCoords) {
    this._textureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._texCoords), gl.STATIC_DRAW);
  }
  
  if(this._normals) {
    this._normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._normals), gl.STATIC_DRAW);
  }

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._indices), gl.STATIC_DRAW);

};

Model.prototype.destroyBuffers = function(context) {
	var gl = context.gl;
	gl.deleteBuffer(this._vertexBuffer);
	gl.deleteBuffer(this._indexBuffer);

	if(this._colourBuffer) {
		gl.deleteBuffer(this._colourBuffer);
	}    
    if(this._textureBuffer) {
    	gl.deleteBuffer(this._textureBuffer);
    }  
    if(this._texture) {
        gl.deleteTexture(this._texture);
    }
    if(this._normalBuffer) {
        gl.deleteBuffer(this._normalBuffer);
    }

	this._vertexBuffer = null;
	this._indexBuffer = null;
	this._colourBuffer = null;
  this._textureBuffer = null;
  this._normalBuffer = null;
};


Model.prototype.getProgram = function() {
	return this._programName;
};

Model.prototype.upload = function(context) {
  if(!this._hasData) { return; }
	var gl = context.gl;
	var program = context.program;

	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	if(this._colourBuffer) {
		gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
		gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexColour'), 4, gl.FLOAT, false, 0, 0);
		gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexColour'));
	}
    
  if(this._textureBuffer) {
  	gl.bindBuffer(gl.ARRAY_BUFFER, this._textureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
  }    
  
  if(this._normalBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, this._normalBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aNormals'), 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aNormals'));
  }
  
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
  
  if(this._texture){
     gl.activeTexture(gl.TEXTURE0);
     gl.bindTexture(gl.TEXTURE_2D, this._texture.get());
     gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);      
  }
};

Model.prototype.render = function(context) {
  if(!this._hasData) { return; }
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLES, this._indices.length , gl.UNSIGNED_SHORT, 0);
};

Model.Quad = function()
{
	return new Model({
				vertices: [			
				0.0, 0.0, 0, 
				1.0, 0.0, 0, 
				1.0, 1.0, 0, 
				0.0, 1.0, 0
				],
    			texCoords: [
        		    0.0, 0.0,
            	    1.0, 0.0,
                    1.0, 1.0,
                    0.0, 1.0
            	 ],
				indices: [0, 1, 2, 0, 2, 3]
			},
			"default"
		);
};

exports.Model = Model;

}, "core/rendercontext": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;


var RenderContext = function(resourceLoader){
    this.gl = null;
	  this.programs = {};
};

RenderContext.prototype.init = function(selector) {
  var canvas =  document.getElementById(selector);
  try
  {
    var ctx = canvas.getContext("experimental-webgl", {antialias: false});
    this.gl = ctx;
  } catch (ex){
    alert("Sorry dude, I couldn't create webgl, try Chrome or something: " + ex);   
  }

  if(!this.gl){
    return;
  }
 
  this._canvasWidth = canvas.width;
  this._canvasHeight = canvas.height;  
  this._currentWidth = canvas.width;
  this._currentHeight = canvas.height;  

  this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
  this.gl.enable(this.gl.DEPTH_TEST);  
};

RenderContext.prototype.currentWidth = function() { return this._currentWidth; };
RenderContext.prototype.currentHeight = function() { return this._currentHeight; };
RenderContext.prototype.canvasWidth = function() { return this._canvasWidth; };
RenderContext.prototype.canvasHeight = function() { return this._canvasHeight; };

RenderContext.prototype.setDimensions = function(width, height) {
  this._currentWidth = width;
  this._currentHeight = height;  
};

RenderContext.prototype.resetDimensions = function() {
  this._currentWidth = this._canvasWidth;
  this._currentHeight = this._canvasHeight;  
};

RenderContext.prototype.createProgram = function(programName) {
	
	var fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);
	var vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);
	
   this.gl.shaderSource(fragmentShader, Cache.Shaders[programName].Fragment);
   this.gl.compileShader(fragmentShader);

   this.gl.shaderSource(vertexShader, Cache.Shaders[programName].Shader);
   this.gl.compileShader(vertexShader);

	if (!this.gl.getShaderParameter(vertexShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(vertexShader);
	}
	if (!this.gl.getShaderParameter(fragmentShader, this.gl.COMPILE_STATUS)) {
		 throw this.gl.getShaderInfoLog(fragmentShader);
	}

   var program = this.gl.createProgram();
	 this.gl.attachShader(program, vertexShader);
   this.gl.attachShader(program, fragmentShader);
   this.gl.linkProgram(program);	

	if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
		throw "Couldn't create program";
	}	

	this.programs[programName] = program;
};


RenderContext.prototype.setActiveProgram = function(programName) {
	if(!this.programs[programName]) { this.createProgram(programName); }
	var program = this.programs[programName];

	this.gl.useProgram(program);
	this.program = program;
	return program;
}; 

exports.RenderContext = RenderContext;

}, "core/renderpipeline": function(exports, require, module) {var RenderTarget = require('./rendertarget').RenderTarget;

exports.RenderPipeline = function(app) {
  var self = this;
  var app = app;
  var vertexBuffer = null;
  var textureBuffer = null;

  var initialSceneRenderTarget = new RenderTarget(128, 128);
  var blurxRenderTarget = new RenderTarget(128, 128);
  var bluryRenderTarget = new RenderTarget(128, 128);

  var fullSizeScreenRenderTarget = new RenderTarget(700, 500, true);
  var outputRenderTarget = new RenderTarget(700, 500, true);

  self.init = function(context) {
    var gl = context.gl;

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

    quadTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadTextureCoords), gl.STATIC_DRAW);

    initialSceneRenderTarget.init(context);
    blurxRenderTarget.init(context);
    bluryRenderTarget.init(context);
    fullSizeScreenRenderTarget.init(context);
    outputRenderTarget.init(context);    
  };


  self.render = function(context) {
    renderSceneToInitialTarget(context);
    passThroughXFilter(context);
    passThroughYFilter(context);
    renderToFullsizeScreen(context);
    renderToScreen(context);
  };

  var renderToFullsizeScreen = function(context) {
    fullSizeScreenRenderTarget.upload(context);
    clearCurrentRenderTarget(context);
    app.scene.render(context);
    fullSizeScreenRenderTarget.clear(context);
  };

  var renderSceneToInitialTarget = function(context) {
    initialSceneRenderTarget.upload(context);
    clearCurrentRenderTarget(context);
    app.scene.render(context);
    initialSceneRenderTarget.clear(context);
  };

  var passThroughXFilter = function(context) {
    blurxRenderTarget.upload(context);
    renderTextureToQuad(context, 'blurx', initialSceneRenderTarget.getTexture());
    blurxRenderTarget.clear(context);
  };

  var passThroughYFilter = function(context) {
    bluryRenderTarget.upload(context);
    renderTextureToQuad(context, 'blury', blurxRenderTarget.getTexture());
    bluryRenderTarget.clear(context);
  };

  var renderToScreen = function(context) {
    var gl = context.gl;
    context.resetDimensions();   

    clearCurrentRenderTarget(context);

    var program = app.context.setActiveProgram('glow'); 

    uploadMatrices(program, context);
    uploadBuffers(program, context);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fullSizeScreenRenderTarget.getTexture());
    gl.uniform1i(gl.getUniformLocation(program, 'uScene'), 0);  

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bluryRenderTarget.getTexture());
    gl.uniform1i(gl.getUniformLocation(program, 'uBlurred'), 1);  

    drawQuad(context);  
  };

  var renderTextureToQuad = function(context, shader, texture) {
    var gl = context.gl;
    clearCurrentRenderTarget(context);

    var program = app.context.setActiveProgram(shader); 

    uploadMatrices(program, context);
    uploadBuffers(program, context);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);  

    drawQuad(context); 
  };
  
  var clearCurrentRenderTarget = function(context) {
    var gl = context.gl;
    gl.viewport(0, 0, context.currentWidth(), context.currentHeight());
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };

  var uploadMatrices = function(program, context) {
    var gl = context.gl;

    // Set the orthographic projection setup
    var projectionMatrix = mat4.ortho(0, context.currentWidth(), context.currentHeight(), 0, -1, 1);
    var viewMatrix = mat4.lookAt([0,0,0], [0,0,-1], [0,1,0]);
    var worldMatrix = mat4.create();
    
    mat4.identity(worldMatrix);
    mat4.scale(worldMatrix, [context.currentWidth(), context.currentHeight(), 1.0]);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
  };

  var uploadBuffers = function(program, context) {
    var gl = context.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
  };

  var drawQuad = function(context) {
    var gl = context.gl;
    gl.depthMask(false);  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);  
  };
  



  var quadVertices =  [
       0.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       0.0,  1.0,  0.0,
       1.0,  1.0,  0.0
  ];

  var quadTextureCoords =  [
         0.0,  1.0, 
         1.0,  1.0,
         0.0,  0.0,
         1.0,  0.0,
    ];



};
}, "core/rendertarget": function(exports, require, module) {exports.RenderTarget = function(width, height, allowNsot) {
  var self = this;
  var width = width;
  var height = height;
  var rttFramebuffer = null;
  var rttTexture = null;
  var renderbuffer  = null;

  self.upload = function(context) {
    var gl = context.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);
    context.setDimensions(width, height);
  };

  self.clear = function(context) {
   var gl = context.gl;
   gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  };

  self.getTexture = function() {
    return rttTexture;
  };

  self.init = function(context) {
    var gl = context.gl;

    rttFramebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, rttFramebuffer);

    rttTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, rttTexture);

    if(allowNsot) {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }
    else {
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    }
    
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    renderbuffer = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, renderbuffer);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH_COMPONENT16, width, height);

    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, rttTexture, 0);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_ATTACHMENT, gl.RENDERBUFFER, renderbuffer);

    gl.bindTexture(gl.TEXTURE_2D, null);
    gl.bindRenderbuffer(gl.RENDERBUFFER, null);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
  };
};
}, "core/resources": function(exports, require, module) {var DefaultModelLoader = require('./defaultmodelloader').DefaultModelLoader;
var DefaultTextureLoader = require('./defaulttextureloader').DefaultTextureLoader;


var ResourceManager = function(app){
    this._app = app;
    this._modelLoaders = [];
    
    this._textureLoader = null;
    
    this._textures = {};
    this._models = {};
    
    this._pendingTextureCount = 0;
    this._pendingModelCount = 0;
};

ResourceManager.prototype.getTexture = function(path){
    if(this._textures[path]) return this._textures[path];   
    
    var resources = this;
    resources._pendingTextureCount++;
    var texture = this._textureLoader.load(path, function(){
            resources._pendingTextureCount--;
            resources.registerForActivation(texture);
        });

    this._textures[path] = texture;
    return texture;    
};

ResourceManager.prototype.onAllAssetsLoaded = function(callback){
    var resources = this;
    var intervalId = setInterval(function(){      
      if( resources._pendingTextureCount == 0 &&
          resources._pendingModelCount == 0)
      {          
        clearInterval(intervalId);
        callback();
      }      
  }, 100);
    
};

ResourceManager.prototype.setTextureLoader = function(loader){
  this._textureLoader = loader;
};

ResourceManager.prototype.addModelLoader = function(loader) {
  this._modelLoaders.push(loader);  
};

ResourceManager.prototype.registerForActivation = function(resource) {
    if(this._app.context)
        resource.activate(this._app.context);
};

ResourceManager.prototype.getModel = function(path) {
    if(this._models[path]) return this._models[path];
    var resources = this;
    for(i in this._modelLoaders){
        var loader = this._modelLoaders[i];
        if(loader.handles(path)){
            resources._pendingModelCount++;
            var model = loader.load(path, function() {
                  resources._pendingModelCount--;
                  resources.registerForActivation(model);  
                });
            this._models[path] = model;
            return model;
        }
    }
};

exports.ResourceManager = ResourceManager;}, "core/scene": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var Camera = require('./camera').Camera;
var CollisionManager = require('./collisionmanager').CollisionManager;
var EventContainer = require('./eventcontainer').EventContainer;

var Scene = function(app){
  this._entities = {};
  this.app = app;
  this.camera = new Camera();
  this.collisionManager = new CollisionManager();
  this.entityAddedListeners = new EventContainer();
  this.entityRemovedListeners = new EventContainer();
  this.entityEventListeners = {};
};

Scene.prototype.onEntityAdded = function(callback) {
  this.entityAddedListeners.add(callback);
};

Scene.prototype.onEntityRemoved = function(callback) {
  this.entityRemovedListeners.add(callback);
};

Scene.prototype.raiseEntityAdded = function(entity) {
  if(!(entity instanceof Entity)) return; // Hack to get around non-entity based entities (legacy)
  this.entityAddedListeners.raise(this, entity);
};

Scene.prototype.raiseEntityRemoved = function(entity) {
  if(!(entity instanceof Entity)) return; // Hack to get around non-entity based entities (legacy)
  this.entityRemovedListeners.raise(this, entity);
};

Scene.prototype.withEntity = function(id, callback) {
  var entity = this.getEntity(id);
  if(entity) {
    callback(entity);
  } else { console.log('Failed to find entity ' + id); }
};

Scene.prototype.getEntity = function(id) {
  return this._entities[id];  
};

Scene.prototype.addEntity = function(entity){
  this._entities[entity.getId()] = entity;
  entity.setScene(this);
  this.raiseEntityAdded(entity);
};

Scene.prototype.removeEntity = function(entity) {
  this.raiseEntityRemoved(entity);
	entity.setScene(undefined);
	delete this._entities[entity.getId()];
};

Scene.prototype.doLogic = function() {
    for(i in this._entities){ 
      this._entities[i].doLogic();
    }
    
    for(i in this._entities){ 
      for(j in this._entities){ 
        if(i === j) continue;
        
        // Note: I know this is sub-optimal
        // When it becomes an issue I'll go all DoD on its ass
        // But not until then
        var entityOne = this._entities[i];
        var entityTwo = this._entities[j];
        this.collisionManager.processPair(entityOne, entityTwo);            
      }
    }
};

Scene.prototype.forEachEntity = function(callback) {
  for(var i in this._entities)
    callback(this._entities[i]);
};

Scene.prototype.broadcastEvent = function(source, eventName, data) {
  var container = this.entityEventListeners[eventName];
  if(container)
    container.raise(source, data);
};

Scene.prototype.eventContainerFor = function(eventName) {
  var container = this.entityEventListeners[eventName];
  if(!container) {
    container =  new EventContainer();
    this.entityEventListeners[eventName] = container;
  }
  return container;
};

Scene.prototype.on = function(eventName, callback) {
  this.eventContainerFor(eventName).add(callback);
};

Scene.prototype.off = function(eventName, type, callback) {
  this.eventContainerFor(eventName).remove(callback);
};

Scene.prototype.render = function(context){
  var gl = context.gl;
  
  this.camera.width = context.canvasWidth();
  this.camera.height = context.canvasHeight();
  this.camera.updateMatrices();

  for(var i in this._entities) {
	  var entity = this._entities[i];
        
    if(entity.getSphere){
      if(!this.camera.frustum.intersectSphere(entity.getSphere())){
        continue;
      }
    }      
	  entity.render(context);
  }       
};

exports.Scene = Scene;
}, "core/texture": function(exports, require, module) {var Texture = function(name, image){
    this._data = null;
    this._image = image;
    this._name = name;
};

Texture.prototype.get = function(){
    return this._data;
};

Texture.prototype.activate = function(context) {
    var gl = context.gl;
    var data = gl.createTexture();
    this._data = data;
    
    data.image = this._image;
    gl.bindTexture(gl.TEXTURE_2D, data);


    // We'll assume if they're equal that they're powers of 2, and if not, they're not
    if(data.image.width !== data.image.height) {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    } else {
      gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, data.image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.GL_LINEAR_MIPMAP_LINEAR);
      gl.generateMipmap(gl.TEXTURE_2D);
    }
   

    gl.bindTexture(gl.TEXTURE_2D, null);
};

exports.Texture = Texture;
}, "entities/aiming": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Frustum = require('../core/frustum').Frustum;
var MissileFactory = require('./missilefactory').MissileFactory;

exports.Tracking = function() {
  var self = this;

	self.targetsInSight = {};

	self.doLogic = function() {		

   self.tidyUpFirst();

   for(var i in self._scene._entities){
      var entity = self._scene._entities[i];
      if(entity === this) continue;
      if(!entity.getOldestTrackedObject) continue;

      // Get a vector to the other entity
      var vectorToOtherEntity = vec3.create([0,0,0]);
      vec3.subtract(entity.position, self.position, vectorToOtherEntity);
      var distanceToOtherEntity = vec3.length(vectorToOtherEntity);            
      vec3.scale(vectorToOtherEntity, 1 / distanceToOtherEntity);

      // Get the direction we're aiming in
      var vectorOfAim = [0,0,-1,1];
      var lookAtTransform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
      mat4.identity(lookAtTransform);
      mat4.rotateY(lookAtTransform, self.rotationY);
      mat4.multiplyVec4(lookAtTransform, vectorOfAim);

      // We must both be within a certain angle of the other entity
      // and within a certain distance
      var quotient = vec3.dot(vectorOfAim, vectorToOtherEntity);            
      if(quotient > 0.75 && distanceToOtherEntity < 250) 
      {
          self.notifyAimingAt(entity);
      }
      else  
      {
          self.notifyNotAimingAt(entity);
      }
    }		
	};

  self.tidyUpFirst = function() {
    for(var i in self.targetsInSight) {
      var entity = self._scene.getEntity(i);
      if(!entity) {
        self.notifyNotAimingAt(self.targetsInSight[i].entity);
        delete self.targetsInSight[i];
        if(this._currentTarget && this._currentTarget.getId() === i)
          this._currentTarget = null;
      }
    }
  };
	
	self.notifyAimingAt = function(entity) {
    var id = entity.getId();
    if(self.targetsInSight[id]) return;
    self.targetsInSight[id] = {
	    entity: entity,
	    time: new Date()
	  };
	  self.raiseEvent('targetGained', { target: entity});
  };

  self.notifyNotAimingAt = function(entity)  {
    var id = entity.getId();
    if(!self.targetsInSight[id]) return;			
    delete self.targetsInSight[id];
    self.raiseEvent('targetLost', { target: entity});
  };
	
	self.getOldestTrackedObject = function() {
		var oldest = null;
		for(var id in self.targetsInSight){
			var current = self.targetsInSight[id];
			if(oldest == null) { 
				oldest = current;
				continue;
			}		
		}
		if(oldest === null) return null;
		return oldest['entity'];
	};

};

exports.Targeting = function(){
  var self = this;

	self._currentTarget = null;

	self.onTargetLost = function(data) {
		if(self._currentTarget === data.target)
			self.deassignTarget();
	};

	self.addEventHandler('targetLost', self.onTargetLost);
	
	self.doLogic = function() {		
		self.evaluateWhetherNewTargetIsRequired();
	};
		
	self.hasCurrentTarget = function() {
		return self._currentTarget !== null;
	};
	
	self.getCurrentTarget = function() {
		return self._currentTarget;
	};
	
	self.deassignTarget = function() {
		var target = self._currentTarget;
		self._currentTarget = null;
		self.raiseEvent('cancelledTrackingTarget', {
			target: target
		});
	};
	
	self.assignNewTarget = function(target) {
		self._currentTarget = target;
		self.raiseEvent('trackingTarget', {
			target: target
		});
	};
	
	self.evaluateWhetherNewTargetIsRequired = function() {
		if(!self.hasCurrentTarget()) {
			var newTarget = self.getOldestTrackedObject();
			if(newTarget != null)	
				self.assignNewTarget(newTarget);
		}	
	};
};
}, "entities/chasecamera": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;


exports.ChaseCamera  = function(scene, playerId) {
  var self = this;
  var cameraMode = "chase";
  var entity = null;

  var cameraLocation = vec3.create([0,100,0]);
  var cameraLookAt = vec3.create([0,0,0]);
  var destinationCameraLocation = vec3.create([0,0,0]);
  var destinationCameraLookAt = vec3.create([0,0,0]);
  
  var distanceBack = 20;
  var fixLocation = false;
  var cameraVelocity = vec3.create([0,0,0]);
  var lookAtVelocity = vec3.create([0,0,0]); 

  var includedTargetId = null;
  var desiredCameraLocationIncludingTarget = vec3.create([0,0,0]);
  var desiredCameraLocationBehindPlayer = vec3.create([0,0,0]);
  var offsetBetweenCamerasWhenStoppedTargetting = vec3.create([0,0,0]);
  var percentageTowardsTarget = 0.0;

  var resetDeltas = function() {
    movementDelta = 0.2;
    lookAtDelta = 0.7;
  };
 
  var onEntityAdded = function(entity) {
    if(entity.getId() === playerId) {
      resetDeltas();
      fixLocation = false;
      setTrackedEntity(entity);
    }
  };

  var onEntityRemoved = function(entity) {
    if(entity.getId() === playerId)
      setTrackedEntity(null);
  };

  var setTrackedEntity = function(newEntity) {
    if(entity)
      unhookEntityEvents(entity);
    entity = newEntity;
    if(entity)
      hookEntityEvents(entity);    
  };

  var hookEntityEvents = function(entity) {
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);    
    entity.addEventHandler('healthZeroed', onPlayerHealthZeroed);
  };

  var unhookEntityEvents = function(entity) {
    entity.removeEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.removeEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
    entity.removeEventHandler('healthZeroed', onPlayerHealthZeroed);
  };

  var onEntityTrackingTarget = function(data) {
    includedTargetId = data.target.getId();
  };

  var onEntityCancelledTrackingTarget = function(data) {
    includedTargetId = null;
    vec3.subtract(desiredCameraLocationIncludingTarget, desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting);
  };

  var onPlayerHealthZeroed = function(data) {
    movementDelta = 0.03;
    lookAtDelta = 0.03;

    var deathPosition = entity.position;

    fixLocationAt([deathPosition[0], deathPosition[1] + 100, deathPosition[1]]);

    scene.withEntity(data.sourceid, function(source) {
      setTimeout(function() {
        setTrackedEntity(source);
      }, 1500);        

      setTimeout(function() {
          fixLocationAt([deathPosition[0], deathPosition[1] + 300, deathPosition[1]]);
      }, 5000);
    });    
  };

  var fixLocationAt = function(position) {
      fixLocation = true;
      destinationCameraLocation = vec3.create(position);
  };

  self.doLogic = function() {
    if(!entity) return;
    workOutWhereTargetIs();
    doLogicAfterAscertainingTarget();
  };

  var updateDesiredCameraPositionIncludingTarget = function() {
    if(!includedTargetId) {
       vec3.add(desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting, desiredCameraLocationIncludingTarget);
    } else {
      var vectorFromTarget = vec3.create([0,0,0]);   
      scene.withEntity(includedTargetId, function(target) {
        vec3.subtract(entity.position, target.position, vectorFromTarget);
        vec3.normalize(vectorFromTarget);
        vec3.scale(vectorFromTarget, distanceBack);        
      });
      vec3.add(entity.position, vectorFromTarget, desiredCameraLocationIncludingTarget);
    }
  };

  var updateDesiredCameraPositionBehindPlayer = function() {    
    var craftRotation = entity.rotationY;
    directionBackZ = distanceBack * Math.cos(craftRotation);
    directionBackX = distanceBack * Math.sin(craftRotation);
    var vectorToDesiredLocation = vec3.create([directionBackX, 0, directionBackZ]);
    vec3.add(entity.position, vectorToDesiredLocation, desiredCameraLocationBehindPlayer);
  };

  var tweenBetweenCompetingLocations = function() {
    if(includedTargetId && percentageTowardsTarget < 1.0)
      percentageTowardsTarget = Math.min(1.0, percentageTowardsTarget + 0.015);
    else if(percentageTowardsTarget > 0.0)
      percentageTowardsTarget = Math.max(0.0, percentageTowardsTarget - 0.015);

    var targetComponent = vec3.create([0,0,0]);
    var chaseComponent = vec3.create([0,0,0]);
    var totalComponent = vec3.create([0,0,0]);

    vec3.scale(desiredCameraLocationBehindPlayer, 1.0 - percentageTowardsTarget, chaseComponent);
    vec3.scale(desiredCameraLocationIncludingTarget, percentageTowardsTarget, targetComponent);

    vec3.add(chaseComponent, targetComponent, totalComponent);
    return totalComponent;    
  };

  var clampLocationToTerrain = function(location) {
     var terrain = scene.getEntity("terrain");   
     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(location[0], location[2]);
     location[1] = Math.max(
                      Math.max(terrainHeightAtCameraLocation + 5, entity.position[1] + 5), 
                      location[1]
                  );
  };

  var workOutWhereTargetIs = function() {   
     var desiredLocation = null;

     updateDesiredCameraPositionIncludingTarget();
     updateDesiredCameraPositionBehindPlayer();
     
     desiredLocation = tweenBetweenCompetingLocations();
     clampLocationToTerrain(desiredLocation);    
     destinationCameraLookAt = vec3.create(entity.position);

     if(!fixLocation)
      destinationCameraLocation = desiredLocation;
  };

  var doLogicAfterAscertainingTarget = function() {
    var directionToWhereWeWantToBe = vec3.create([0,0,0]);
    vec3.subtract(destinationCameraLocation, cameraLocation, directionToWhereWeWantToBe);
    vec3.scale(directionToWhereWeWantToBe, movementDelta , cameraVelocity);
    vec3.add(cameraLocation, cameraVelocity); 

    var directionToWhereWeWantToLookAt = vec3.create([0,0,0]);
    vec3.subtract(destinationCameraLookAt, cameraLookAt, directionToWhereWeWantToLookAt);
    vec3.scale(directionToWhereWeWantToLookAt, lookAtDelta , lookAtVelocity);
    vec3.add(cameraLookAt, lookAtVelocity); 
    scene.camera.lookAt = vec3.create(cameraLookAt);
    scene.camera.location = vec3.create(cameraLocation);
  };

  scene.onEntityAdded(onEntityAdded);
};

exports.ChaseCamera.Create = function(scene, playerId) {
  var entity = new Entity('chase-camera');
  entity.attach(exports.ChaseCamera, [scene, playerId]);
  scene.addEntity(entity);
  return entity;
};
}, "entities/clipping": function(exports, require, module) {var Clipping = function() {
  var self = this;

  self.setBounds = function(min, max){
    self._min = min;
    self._max = max;
  };
  
  self.doLogic = function(){
    for(var i = 0 ; i < 3 ; i++){
        if(self.position[i] < self._min[i]) {
            self.position[i] = self._min[i];
            self._velocity[i] = 0;
        }
        else if(self.position[i] > self._max[i]) {
            self.position[i] = self._max[i];
            self._velocity[i] = 0;
        }
    }
  };
    
};

exports.Clipping = Clipping;
}, "entities/destructable": function(exports, require, module) {exports.Destructable = function() {
  var self = this;

  var onNoHealthLeft = function(data) {
    self.raiseServerEvent('entityDestroyed', {
      id: self.getId()
    });
  };

  self.addEventHandler('healthZeroed', onNoHealthLeft);
};
}, "entities/explodable": function(exports, require, module) {var Explosion = require('./explosion').Explosion;

exports.Explodable = function() {
  var self = this;

  var onEntityDestroyed = function() {
    var explosion = new Explosion(self._scene.app, {
      position: self.position,    
      initialVelocity: vec3.create([0,0,0])
      }
    );    
  };  
 
  self.addEventHandler('healthZeroed', onEntityDestroyed);
};
}, "entities/explosion": function(exports, require, module) {var ParticleEmitter = require('./particleemitter').ParticleEmitter;

exports.Explosion = function(app, details) {
  var date = new Date();

  var directionOfExplosion = vec3.create([0,0,0]);
  var speed = vec3.length(details.initialVelocity);
  
  if(speed > 0.5) {
    vec3.normalize(details.initialVelocity, directionOfExplosion);
    vec3.scale(directionOfExplosion, 30.0);
  }

  var fireEmitter = new ParticleEmitter('Explosion-' + date, 1000, app,
  {
      maxsize: 1500,
      maxlifetime: 1.5,
      rate: 500,
      position: details.position,
      scatter: vec3.create([0.2, 0.2, 0.2]),
      particleOutwardVelocityMin: vec3.create([-12,-12,-12]),
      particleOutwardVelocityMax: vec3.create([12,12,12]),
      particleTrajectoryVelocity: directionOfExplosion,
      textureName: '/data/textures/explosion.png'
  });
  app.scene.addEntity(fireEmitter);
  setTimeout(function() {
    fireEmitter.stop();
  }, 150);
  setTimeout(function() {
    app.scene.removeEntity(fireEmitter);
  }, 10000); 

  var smokeEmitter = new ParticleEmitter('Smoke-' + date, 150, app,
  {
      maxsize: 1500,
      maxlifetime: 2.5,
      rate: 30,
      position: details.position,
      scatter: vec3.create([0.2, 0.2, 0.2]),
      particleOutwardVelocityMin: vec3.create([-5.0,0.5,-5.0]),
      particleOutwardVelocityMax: vec3.create([5.0,10.0,5.0]),
      textureName: '/data/textures/smoke.png'
  });

  app.scene.addEntity(smokeEmitter);

  setTimeout(function() {
    smokeEmitter.stop();
  }, 250);

  setTimeout(function() {
    app.scene.removeEntity(smokeEmitter);
  }, 10000);

};


}, "entities/firingcontroller": function(exports, require, module) {exports.FiringController = function() {
	var self = this;

  var missileidCounter = 0;
  var trackingStartTime = null;
  var trackedTarget = null;
  var status = "null";
	var trackedMissileId  = null;
  var fired = false;

  var onTrackingTarget = function(ev) {
	  trackingStartTime = new Date();
	  trackedTarget = ev.target;
    status = "tracking";
  };
	
  var onCancelledTrackingTarget = function(ev) {
    if(status !== "fired") 
      self.resetFiringState();
  };
	
  self.doLogic = function() {
	  if(!trackedTarget || fired) return;
	  var currentTime = new Date();
	  var timeElapsedSinceStartedTracking = currentTime - trackingStartTime;
	  if(timeElapsedSinceStartedTracking > 1500 && status === "tracking") {
		  status = "locked";
      self.raiseServerEvent('missileLock', {
        sourceid: self.getId(),
        targetid: trackedTarget.getId()
      });
    }
  };

  var onFireRequest = function() {
    self.tryFireMissile();
  };

  self.resetFiringState = function() {
    trackingStartTime = null;
    trackedTarget = null;
    status = "null";
    trackedMissileId = null;
  };

  self.tryFireMissile = function() {
    if(status !== "locked") return;
    status = "fired";
    var missileid = 'missile-' + self.getId() + missileidCounter++;
    trackedMissileId = missileid;
	  self.raiseServerEvent('fireMissile', { 
        missileid: missileid, 
        sourceid: self.getId(), 
        targetid: trackedTarget.getId()
    });    
  };  

  self.addEventHandler('trackingTarget', onTrackingTarget);
  self.addEventHandler('cancelledTrackingTarget', onCancelledTrackingTarget);
  self.addEventHandler('fireRequest', onFireRequest);
};
}, "entities/hovercraft": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var Hovercraft = function() {
  var self = this;

  self._decay = 0.985;

  self.reset = function() {
    self._velocity = vec3.create([0.01,0,0.01]);
    self._left = false;
    self._right = false;
    self._jump = false;
    self._forward = false;
    self._backward = false;
  };
  
  self.reset();
  
  self.getSphere = function() {
      return self._model.boundingSphere.translate(self.position);
  };
  
  self.startForward = function() {
    self._forward = true;  
  };
  
  self.cancelForward = function() {
    self._forward  = false;  
  };
  
  self.startLeft = function() {
      self._left = true;
  };
  
  self.cancelLeft = function() {
      self._left = false;
  };
  
  self.startRight = function() {
    self._right = true;  
  };
  
  self.cancelRight = function() {
      self._right = false;
  };
  
  self.startBackward = function() {
      self._backward = true;
  };
  
  self.cancelBackward = function() {
      self._backward = false;
  };
  
  self.startUp = function() {
      self._jump = true;
  };
  
  self.cancelUp = function() {
      self._jump = false;
  };
  
  self.impulseForward = function() {
      var amount = 0.05;
      var accelerationZ = (-amount) * Math.cos(self.rotationY);
      var accelerationX = (-amount) * Math.sin(self.rotationY);
      var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
      vec3.add(self._velocity, acceleration);
  };
  self.impulseBackward = function() {
      var amount = 0.03;
      var accelerationZ = (amount) * Math.cos(self.rotationY);
      var accelerationX = (amount) * Math.sin(self.rotationY);
      var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
      vec3.add(self._velocity, acceleration);
  };
  self.impulseLeft = function() {
      var amount = 0.07;
      self.rotationY += amount;
  };
  self.impulseRight = function() {
      var amount = 0.07;
      self.rotationY -= amount;
  };
  self.impulseUp = function() {
      var amount = 0.25;
      var terrain = self._scene.getEntity("terrain");
      
      var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
      var heightDelta = self.position[1] - terrainHeight;
      
      if(heightDelta < 20.0) {
          self._velocity[1] += amount;
      }
  };
  
  self.processInput = function() {
    if(self._left) {
      self.impulseLeft();
    }
    else if(self._right) {
      self.impulseRight();
    }
    
    if(self._forward) {
      self.impulseForward();
    } 
    else if( self._backward) {
      self.impulseBackward();
    };
    
    if(self._jump) {
     self.impulseUp();   
    }
  };
  
  self.doLogic = function() {
    self.processInput();
    
    var terrain = self._scene.getEntity("terrain");
    vec3.add(self.position, self._velocity);
                 
    var terrainHeight = terrain == null ? 10 : terrain.getHeightAt(self.position[0], self.position[2]);  
    var heightDelta = self.position[1] - terrainHeight;
    
    if(heightDelta < 0.5) {
      self.position[1] = terrainHeight + (0.5 - heightDelta);
      if(self._velocity[1] < 0)
        self._velocity[1] = -self._velocity[1] * 0.25;
    }

    if(Math.abs(self._velocity[1]) < 0.0001)
	    self._velocity[1] = 0;
     
     if(heightDelta < 5.0){
         self._velocity[1] += (5.0 - heightDelta) * 0.03;
     }
     self._velocity[1] -= 0.025;              
     vec3.scale(self._velocity, self._decay);
  };
  
  self.updateSync = function(sync) {
    sync.position = self.position;
    sync.rotationY = self.rotationY;
  };

  self.projectileHit = function(data) {
    self.raiseServerEvent('healthZeroed', data);
  };
}
         
exports.Hovercraft = Hovercraft;
         

}, "entities/hovercraftfactory": function(exports, require, module) {var Entity = require('../core/entity').Entity;

var Hovercraft = require('./hovercraft').Hovercraft;
var Clipping = require('./clipping').Clipping;
var Tracking = require('./aiming').Tracking;
var Targeting = require('./aiming').Targeting;
var NamedItem = require('./nameditem').NamedItem;
var FiringController = require('./firingcontroller').FiringController;
var Destructable = require('./destructable').Destructable;
var Explodable = require('./explodable').Explodable;
var Smoother = require('./smoother').Smoother;

var HovercraftFactory = function(app){
  this._app = app;  
};

HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.json");
  var entity = new Entity(id);
  
  entity.setModel(model); 
  entity.attach(Hovercraft);
  entity.attach(Tracking);
  entity.attach(Targeting);
  entity.attach(NamedItem);
  entity.attach(FiringController);
  entity.attach(Destructable);

  if(this._app.isClient) {
    entity.attach(Explodable);
    entity.attach(Smoother);
  }
  
 // entity.attach(Clipping);
//  entity.setBounds([-1000,-1000, -1000], [1000,1000,1000]);
  return entity;
};

exports.HovercraftFactory = HovercraftFactory;
}, "entities/hovercraftspawner": function(exports, require, module) {var Entity = require('../core/entity').Entity;
var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;
var Hovercraft = require('./hovercraft').Hovercraft;

exports.HovercraftSpawner = function(scene) {
  var self = this;  
  var hovercraftFactory = new HovercraftFactory(scene.app);
  var playerNames = {};

  scene.addEntity(self);

  self.createPlayer = function(id) {
    self.raiseServerEvent('playerJoined', {
      id: id
    });
  };

  self.spawnHovercraft = function(id) {
    var position = vec3.create([
      Math.random() * 400 - 200,
       200,
      Math.random() * 400 - 200
    ]);

    self.raiseServerEvent('entitySpawned', {
      id: id,
      position: position
    });
  };

  self.removePlayer = function(id) {
    var craft = scene.getEntity(id);
    if(!craft) return;
    self.raiseServerEvent('playerLeft', {
      id: id
    });
  };

  self.namePlayer = function(id, name) {
    self.raiseServerEvent('playerNamed', {
      id: id,
      name: name
    });
  };

  self.setSync = function(sync) {
    playerNames = sync.playerNames;
    updateAllPlayerNames();
  };

  self.updateSync = function(sync) {
    sync.playerNames = playerNames;
  };
  
  var onEntityAddedToScene = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.displayName(playerNames[entity.getId()]);
  };

  var updateAllPlayerNames = function() {
    for(var playerId in playerNames)
      scene.withEntity(playerId, function(entity) {
        entity.displayName(playerNames[playerId]);
      });
  };

  var onEntityDestroyed = function() {
    var id = this.getId();
    scene.removeEntity(this);

    setTimeout(function() {
      raiseEntityRevived(id);
    }, 10000);
  };

  var raiseEntityRevived = function(id) {
    self.raiseServerEvent('entityRevived', { id: id });
  };

  var onEntityRevived = function(data) {
    self.spawnHovercraft(data.id);
  };  

  var onPlayerLeft = function(data) {
    var craft = scene.getEntity(data.id);
    scene.removeEntity(craft);
  };

  var onEntitySpawned = function(data) {
    var craft = hovercraftFactory.create(data.id);   
	  craft.position = data.position;
    scene.addEntity(craft);
  };

  var onPlayerNamed = function(data) {
    playerNames[data.id] = data.name;
  };

  var onPlayerJoined = function(data) {
    self.spawnHovercraft(data.id);
  };

  scene.on('entityDestroyed', onEntityDestroyed);
  scene.onEntityAdded(onEntityAddedToScene);

  self.addEventHandler('playerNamed', onPlayerNamed);
  self.addEventHandler('entityRevived', onEntityRevived);
  self.addEventHandler('playerLeft', onPlayerLeft);
  self.addEventHandler('playerJoined', onPlayerJoined);
  self.addEventHandler('entitySpawned', onEntitySpawned);
};

exports.HovercraftSpawner.Create = function(scene) {
  var entity = new Entity('hovercraft-spawner');
  entity.attach(exports.HovercraftSpawner, [scene]);
  return entity;
};
}, "entities/landchunk": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var LandChunk = function(width, height, maxHeight, scale,x,y){
  this._maxHeight = maxHeight;
  this._width = width;
  this._height = height;
  this._x = x;
  this._y = y;
  this._scale = scale;

  this._vertexBuffer = null;
  this._indexBuffer = null;
  this._indexCount = 0;
  this._texturecoordsBuffer = null;
  this._heightBuffer = null;

  this._diffuseTexture = null;
  this._data = null;

  this._frame = 0.0;
  this._playerPosition = vec3.create();
  this._cameraPosition = vec3.create();
};

LandChunk.prototype.getProgram = function(){
    return "landscape";
};

LandChunk.prototype.loadTextures = function(resources) {
    this._diffuseTexture = resources.getTexture('/data/textures/grid.png');
};

LandChunk.prototype.setData = function(data) {
    this._data = data;
};

LandChunk.prototype.activate = function(context) {
    var gl = context.gl;
  	 
	this._vertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.vertices), gl.STATIC_DRAW);

  this._heightBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._heightBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.heights), gl.STATIC_DRAW);
    
	this._texturecoordsBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(this._data.texturecoords), gl.STATIC_DRAW)

	this._indexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
	gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(this._data.indices), gl.STATIC_DRAW);

	this._indexCount = this._data.indices.length;    	
};

LandChunk.prototype.upload = function(context) {
  if(!this._data) { return; }
    var gl = context.gl;
	var program = context.program;

  // Theoretically we'll not to keep re-uploading these if we do something with our scene
	gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));

	gl.bindBuffer(gl.ARRAY_BUFFER, this._texturecoordsBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoord'), 2, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoord'));
      
	gl.activeTexture(gl.TEXTURE0);
	gl.bindTexture(gl.TEXTURE_2D, this._diffuseTexture.get());
	gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0); 

	gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);

  // This is the only thing we have to re-upload
	gl.bindBuffer(gl.ARRAY_BUFFER, this._heightBuffer);
	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexHeight'), 1, gl.FLOAT, false, 0, 0);
	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexHeight'));


};

LandChunk.prototype.render = function(context) {
  if(!this._data) { return; }
  this._frame++;
	var gl = context.gl;
	gl.drawElements(gl.TRIANGLE_STRIP, this._indexCount, gl.UNSIGNED_SHORT, 0);
};

LandChunk.prototype.getHeightAt = function(x, z) {
    if(!this._data) {
        return 6;
    }
    
    var heightmap = this._data.heights;
    
    // Transform to values we can (almost) index our array with
    var transformedX = x - this._x;
    var transformedZ = z - this._y;
    
    var baseX = Math.floor(transformedX);
    var baseZ = Math.floor(transformedZ);

    var horizontalWeight = transformedX - baseX;
    var verticalWeight = transformedZ - baseZ; 
    
    var leftX = baseX;
    var rightX = baseX + 1;
    var topX = baseZ; 
    var bottomX = baseZ + 1;
        
    var topLeft = heightmap[leftX + topX * this._width];
    var topRight = heightmap[rightX + topX * this._width];
    var bottomLeft = heightmap[leftX + bottomX * this._width];
    var bottomRight = heightmap[rightX + bottomX * this._width];
    
    var top = (horizontalWeight*topRight)+(1.0-horizontalWeight)*topLeft;
    var bottom = (horizontalWeight*bottomRight)+(1.0-horizontalWeight)*bottomLeft;
    
    return (verticalWeight*bottom)+(1.0-verticalWeight)*top;
};

exports.LandChunk = LandChunk;
}, "entities/landscapecontroller": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Entity = require('../core/entity').Entity;


var LandscapeController = function(app){
  app.scene.addEntity(this);
  
  this.app = app;
  this._chunks = {};
  this._counter = 0;
  this._chunkWidth = 128;
  this._scale = 5;
  
  this.loadChunks(0,0);
};

LandscapeController.prototype.getId = function() {
  return "terrain";  
};

LandscapeController.prototype.getHeightAt = function(x, z) {
    x /= this._scale;
    z /= this._scale;    
    
    var currentChunkX = parseInt(x / this._chunkWidth) * this._chunkWidth;
    var currentChunkZ = parseInt(z / this._chunkWidth) * this._chunkWidth;
    
    if(x < 0) { currentChunkX -= this._chunkWidth; }
    if(z < 0) { currentChunkZ -= this._chunkWidth; }
    
    var key = currentChunkX + '_' + currentChunkZ
    
    var chunk = this._chunks[key];
    if(chunk)
    {
        return chunk.getHeightAt(x, z);
    }
    else
    {
        return 120; // FTW
    }    
};

LandscapeController.prototype.loadChunks = function(x, z){
  var app = this.app,
  scene = this.app.scene;
         
  var currentx = x / this._scale;
	var currentz = z / this._scale;

	var currentChunkX = Math.floor(currentx / this._chunkWidth) * this._chunkWidth;
	var currentChunkZ = Math.floor(currentz / this._chunkWidth) * this._chunkWidth;

	var minX = currentChunkX - (this._chunkWidth);
	var minZ = currentChunkZ - (this._chunkWidth);
	var maxX = currentChunkX + (this._chunkWidth);
	var maxZ = currentChunkZ + (this._chunkWidth);

	for(var x = minX; x <= maxX ; x += this._chunkWidth) {
		for(var z = minZ; z <= maxZ ; z += this._chunkWidth) {
			var key = x + '_' + z;
			if(this._chunks[key]) { continue; }
            
      var data = 'chunk_' + JSON.stringify({
         height: this._chunkWidth + 1,
         width: this._chunkWidth + 1,
         maxHeight: 100,
         scale: this._scale,
         x: x,
         y: z               
      })

      var model = app.resources.getModel(data);
			var chunkEntity = new Entity('Chunk_' + key);
      chunkEntity.setModel(model);
      chunkEntity.attach(LandChunkEntity);
			chunkEntity.position = vec3.create([x * this._scale, 0, z * this._scale]);

			this._chunks[key] = chunkEntity;
			this.app.scene.addEntity(chunkEntity);			
		}
	}
};

LandChunkEntity = function() {
  var self = this;
  self.getHeightAt = function(x,z){
   return self._model.getHeightAt(x,z);   
  }
};

LandscapeController.prototype.doLogic = function() {
    
  var light = this.app.scene.getEntity("light");
  
  if(light) {
      var lightPosition = light.position;

      for(i in this._chunks){
       var chunk = this._chunks[i];
       chunk._model._playerPosition = lightPosition;
       chunk._model._cameraPosition = this.app.scene.camera.location;
      }
  }
    
};

// Interface segregation, I rather suspect I should do something about this in scene

LandscapeController.prototype.setScene = function(scene){};
LandscapeController.prototype.render = function(context){};
LandscapeController.prototype.is = function(){return false;};
exports.LandscapeController = LandscapeController;
LandscapeController.prototype.addEventHandler = function() { };
LandscapeController.prototype.removeEventHandler = function() {};
}, "entities/missile": function(exports, require, module) {Sphere = require('../core/bounding').Sphere;

var Missile = function() {
  var self = this;

 	self.target = null;
	self.source = null;
	self._velocity = vec3.create([0,0,0]);	

	var bounds = new Sphere(1.0, [0,0,0]);
  var isTrackingTarget = false;
	var distanceFromTarget = vec3.create([99,99,99]);

	self.setSource = function(sourceid, position) {
		self.sourceid = sourceid;
		self.position = vec3.create(position);	
	};
  self.setTarget = function(targetid) {
    self.targetid = targetid;
    isTrackingTarget = true;
  };
  self.clearTarget = function() {
    self.targetid = null;
    isTrackingTarget = false;
  };

  self.doLogic = function() {
   if(isTrackingTarget) updateTargetReferences();

    if(isTrackingTarget) {   
		  updateVelocityTowardsTarget();
		  performPhysics();
		  determineIfTargetIsReached();
    } else {
      performPhysics();
    }		
	};

  var updateTargetReferences = function() {
    self.source = getSource();
    self.target = getTarget();

    if(!self.source || !self.target) {
      isTrackingTarget = false;
			self.raiseServerEvent('missileLost', { 
				targetid: self.targetid,
				sourceid: self.sourceid,
        missileid: self.getId()
      });
    }
  };

  var getSource = function() {
    return self._scene.getEntity(self.sourceid);
  };

  var getTarget = function() {
    return self._scene.getEntity(self.targetid);
  };
	
	var determineIfTargetIsReached = function() {
		var myBounds = bounds.translate(self.position);
    
		var targetSphere = self.target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
      notifyTargetOfCollision();  
      notifyOutsideWorldOfCollision();
    }
	};

  var notifyOutsideWorldOfCollision = function(){ 
	  self.raiseServerEvent('targetHit', { 
			targetid: self.targetid,
			sourceid: self.sourceid,
      missileid: self.getId() 
    });		  
  };

  var notifyTargetOfCollision = function(){ 
	  self._scene.withEntity(self.targetid, function(target) {
      target.sendMessage('projectileHit', {
			  targetid: self.targetid,
			  sourceid: self.sourceid // TODO: Damage amount goes here :-)
      });
    });
  }; 
	
	var performPhysics = function() {
		vec3.add(self.position, self._velocity);

    if(isTrackingTarget) {
		  if(!isWithinReachOfTarget())
			  clipMissileToTerrain();      
    }
    else
		    checkIfMissileHasHitTerrain();
	};

  var checkIfMissileHasHitTerrain = function() {
    var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
    if(terrainHeight > self.position[1]) {
		  self.raiseServerEvent('missileExpired', { 
        missileid: self.getId() 
      });
	  }
  };
	
	var isWithinReachOfTarget = function() {
		var difference = calculateVectorToTarget();
		difference[1] = 0;
		var distanceToTargetIgnoringHeight = vec3.length(difference);
		return distanceToTargetIgnoringHeight < 2;		
	};
	
	var updateVelocityTowardsTarget = function() {
		var difference = calculateVectorToTarget();
		distanceFromTarget = vec3.length(difference);

    vec3.normalize(difference);
    var speed = 0.8;  
		vec3.scale(difference, speed);	
    vec3.add(self._velocity, difference);
    vec3.scale(self._velocity, 0.8);
	};
	
	var clipMissileToTerrain = function(vectorToTarget) {
		var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
		self.position[1] =  Math.max(terrainHeight, self.position[1]);	
	};
	
	var calculateVectorToTarget = function() {	
    var targetDestination = self.target.position;
    var currentPosition = self.position;
	  var difference = vec3.create([0,0,0]);
	  vec3.subtract(targetDestination, currentPosition, difference);
	  return difference;
	};

  var onTargetLost = function() {
    self.clearTarget();
  };

  self.addEventHandler('targetLost', onTargetLost);
};

exports.Missile = Missile;
}, "entities/missilefactory": function(exports, require, module) {Entity = require('../core/entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function() {};

MissileFactory.prototype.create = function(missileid, sourceid, targetid, position) {
  var entity = new Entity(missileid); 
  entity.attach(Missile);
  entity.setSource(sourceid, position);
  entity.setTarget(targetid);

  return entity;
};

exports.MissileFactory = MissileFactory;
}, "entities/missilefirer": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var FiringController = require('./firingcontroller').FiringController;
var Missile = require('./missile').Missile;

exports.MissileFirer = function(app, missileFactory) {
  var self = this;

  var onEntityFiredMissile = function(data) {
    var source = app.scene.getEntity(data.sourceid);
    var target = app.scene.getEntity(data.targetid);
   
    if(!source) { console.warn('Erk, could not find source of missile firing'); return; };
    if(!target) { console.warn('Erk, could not find target of missile firing'); return; };

    var missile = missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
    app.scene.addEntity(missile);
  };

  var onTargetHit = function(data) {
    removeMissileFromScene(data.missileid);
  };

  var onMissileExpired = function(data) {
    removeMissileFromScene(data.missileid);
  };

  var removeMissileFromScene = function(id) {
    app.scene.withEntity(id, function(missile) {
	    app.scene.removeEntity(missile);
    });	
  };      

  app.scene.on('fireMissile', onEntityFiredMissile);
  app.scene.on('targetHit',  onTargetHit);
  app.scene.on('missileExpired', onMissileExpired);
};
}, "entities/nameditem": function(exports, require, module) {exports.NamedItem = function() {
  var self = this;
  var displayName = null;
  var displayNameChanged = false;

  self.displayName = function(name) {
    if(name) {
      displayName = name;
      displayNameChanged = true;
    }
    return displayName;
  }; 
};
}, "entities/particleemitter": function(exports, require, module) {var randoms = new Array(randomsCount);
var randomsCount = 100000;

for(var x = 0; x < 100000; x++) {
  randoms[x] = Math.random();
}
var currentRandom = 0;

var currentValue = 0.000001;
nextRandom = function(){
  return Math.random();
}

ParticleEmitter = function(id, capacity, app, config) {
    this.id = id;
    this.app = app;
    this.active = true;
    this.capacity = capacity;
    this.positions = new Float32Array(capacity * 3);
    this.velocities = new Float32Array(capacity * 3);
    this.colours = new Float32Array(capacity * 3);
    this.sizes = new Float32Array(capacity);
    
    var config = config || {};    
    this.maxsize = config.maxsize || 20;
    this.maxlifetime = config.maxlifetime || 2.5;
    this.scatter = config.scatter || vec3.create([0.01,0.01,0.01]);
    
    this.track = config.track || function() {};
    this.time = 0;
    this.ticks = 0;
    this.rate = config.rate || 50;
            
    this.lifetimes = new Float32Array(capacity);
    this.creationTimes = new Float32Array(capacity);
    
    this.position =  config.position || vec3.create([0,0,0]);

    this.particleOutwardVelocityMin = config.particleOutwardVelocityMin || vec3.create([-1,-1,-1]);
    this.particleOutwardVelocityMax = config.particleOutwardVelocityMax || vec3.create([1,1,1]);
    this.particleTrajectoryVelocity = config.particleTrajectoryVelocity || vec3.create([0,0,0]);

    this.textureName = config.textureName || '/data/textures/particle.png';

    if(this.textureName) {
      this.texture = this.app.resources.getTexture(this.textureName);
    }


    var randoms = [];
    var variance = vec3.create([1.0, 1.0, 1.0]);
    vec3.subtract(this.particleOutwardVelocityMax, this.particleOutwardVelocityMin, variance);
    
    for(var x = 0 ; x < capacity; x++) {
        var vertex = x * 3;
        var colour = x * 3;
        
        this.positions[vertex] = this.position[0];
        this.positions[vertex+1] = this.position[1];
        this.positions[vertex+2] = this.position[2];


     
        this.velocities[vertex] = this.particleTrajectoryVelocity[0] +
                                     (this.particleOutwardVelocityMax[0] - (nextRandom() * variance[0])); 

        this.velocities[vertex+1] =  this.particleTrajectoryVelocity[1] + 
                                    (this.particleOutwardVelocityMax[1] - (nextRandom()  * variance[1])); 

        this.velocities[vertex+2] =  this.particleTrajectoryVelocity[2] + 
                                   (this.particleOutwardVelocityMax[2] - (nextRandom() * variance[2])); 


        this.colours[colour] = 1.0;
        this.colours[colour+1] = 1.0;
        this.colours[colour+2] = 1.0; 
          
        this.sizes[x] = Math.random();
        this.creationTimes[x] = -1000;
        this.lifetimes[x] = Math.random() * this.maxlifetime;
    }
    
    this.createBuffers();
    this.track();
};

ParticleEmitter.prototype.start = function() {
  this.active = true;
};

ParticleEmitter.prototype.stop = function() {
  this.active = false;
};

ParticleEmitter.prototype.createBuffers = function(){
  var gl = this.app.context.gl;
  
  this.createConstantBuffers(gl);
  this.createVariableBuffers(gl);  
};

ParticleEmitter.prototype.createVariableBuffers = function(gl) {
    
    if(!this._vertexBuffer) {
        this._vertexBuffer = gl.createBuffer();
        this._creationTimesBuffer = gl.createBuffer();
    }

  gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.positions, gl.DYNAMIC_DRAW);  
  gl.bindBuffer(gl.ARRAY_BUFFER, this._creationTimesBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.creationTimes, gl.DYNAMIC_DRAW); 
};

ParticleEmitter.prototype.createConstantBuffers = function(gl){
    
  this._velocityBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.velocities, gl.STATIC_DRAW);
  
  this._colourBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.colours, gl.STATIC_DRAW);
  
  this._sizeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.sizes, gl.STATIC_DRAW);
  
  this._lifetimeBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, this._lifetimeBuffer);
  gl.bufferData(gl.ARRAY_BUFFER, this.lifetimes, gl.STATIC_DRAW);

}

ParticleEmitter.prototype.getId = function() { return this.id; }

ParticleEmitter.prototype.doLogic = function() {
    this.time += 0.01;
    this.ticks++;

    if(!this.active) return;
     

    var lastPosition = vec3.create(this.position);
    var interpolation = vec3.create();
    this.track.call(this);
    
    vec3.subtract(this.position, lastPosition, interpolation);
    vec3.scale(interpolation, 1.0 / this.rate);
    
    if(!this.seeker) this.seeker = 0;
        
    // Search through and find any free particles
    var countFound = 0;
    for( ; this.seeker < this.capacity; this.seeker++){
        var x = this.seeker;
        var vertex = x * 3;
        var age = this.time - this.creationTimes[x];
        
        if(age > this.lifetimes[x]) {

            this.creationTimes[x] = this.time;

            this.positions[vertex] = this.position[0] + countFound * interpolation[0];
            this.positions[vertex+1] = this.position[1] + countFound * interpolation[1];
            this.positions[vertex+2] = this.position[2] + countFound * interpolation[2];
            
            this.positions[vertex] += this.scatter[0] - (Math.random() * this.scatter[0] * 2);
            this.positions[vertex+1] += this.scatter[1] - (Math.random() * this.scatter[1] * 2);
            this.positions[vertex+2] += this.scatter[2] - (Math.random() * this.scatter[2] * 2);

            if(countFound++ == this.rate) { break; }            
        }
    }
    
    if(this.seeker == this.capacity) { this.seeker = 0; }
    
    if(countFound > 0){
       this.createVariableBuffers(this.app.context.gl);
    }
};

ParticleEmitter.prototype.setScene = function(scene) {
  this.scene = scene;
};

ParticleEmitter.prototype.render = function(context) {
    var gl = context.gl;
    
    var viewMatrix = this.scene.camera.getViewMatrix();
    var projectionMatrix = this.scene.camera.getProjectionMatrix(gl);
    
    var program = context.setActiveProgram("particles");
    
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.enable(gl.BLEND);
    gl.depthMask(false);
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._velocityBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVelocity'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVelocity'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._colourBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aColour'), 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aColour'));    
        
    gl.bindBuffer(gl.ARRAY_BUFFER, this._sizeBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aSize'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aSize'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._creationTimesBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aCreationTime'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aCreationTime'));
    
    gl.bindBuffer(gl.ARRAY_BUFFER, this._lifetimeBuffer);
    gl.vertexAttribPointer(gl.getAttribLocation(program, 'aLifetime'), 1, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aLifetime'));
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.texture.get());
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0)
    
    var camera = this.scene.camera.location;
    gl.uniform3f(gl.getUniformLocation(program, 'vCamera'), camera[0], camera[1], camera[2] );
    gl.uniform1f(gl.getUniformLocation(program, 'time'), this.time);
    gl.uniform1f(gl.getUniformLocation(program, 'maxsize'), this.maxsize);
    
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
        
    var gl = context.gl;
	  gl.drawArrays(gl.POINTS, 0, this.capacity);
    
    gl.disable(gl.BLEND);
    gl.depthMask(true);
    
};

ParticleEmitter.prototype.is = function() { return false; };
exports.ParticleEmitter = ParticleEmitter;












}, "entities/scorekeeper": function(exports, require, module) {var Entity = require('../core/entity').Entity;
var Hovercraft = require('./hovercraft').Hovercraft;
var HovercraftSpawner = require('./hovercraftspawner').HovercraftSpawner;

exports.ScoreKeeper = function(scene) {
  var self = this;
  var playerScores = {};

  self.getScores = function() {
    return playerScores;
  };

  self.setSync = function(sync) {
    playerScores = sync.playerScores;
  };

  self.updateSync = function(sync) {
    sync.playerScores = playerScores;
  };

  var onCraftDestroyed = function(data) {
   self.raiseServerEvent('playerScoreChanged', {
    id: data.sourceid,
    score: getPlayerScore(data.sourceid) + 1
   });
  };

  var onScoreChanged = function(data) {
    setPlayerScore(data.id, data.score);
  };

  var onPlayerJoined = function(data) {
    var player = ensurePlayer(data.id);
    player.score = 0;
  };

  var onPlayerLeft = function(data) {
    delete playerScores[data.id];
  };

  var onPlayerNamed = function(data) {
    setPlayerName(data.id, data.name);
  };

  var setPlayerName = function(playerId, name) {
    var player = ensurePlayer(playerId);
    if(!player) return;
    player.name = name;
  };

  var getPlayerScore = function(playerId) {
    var player = ensurePlayer(playerId);
    return player.score;
  };

  var setPlayerScore = function(playerId, score) {
    var player = ensurePlayer(playerId);
    player.score = score;
  };

  var ensurePlayer = function(id) {
     var player = playerScores[id];
     if(!player) {
      player = playerScores[id] = {
        name: '',
        score: 0
      };
     }
     return player;
  };

  self.addEventHandler('playerScoreChanged', onScoreChanged);
  scene.on('healthZeroed', onCraftDestroyed);
  scene.on('playerJoined', onPlayerJoined);
  scene.on('playerLeft',  onPlayerLeft); 
  scene.on('playerNamed', onPlayerNamed);
};

exports.ScoreKeeper.GetFrom = function(scene) {
  return scene.getEntity('score-keeper');
};

exports.ScoreKeeper.Create = function(scene) {
  var entity = new Entity('score-keeper');
  entity.attach(exports.ScoreKeeper, [scene]);
  scene.addEntity(entity);
  return entity;
};
}, "entities/smoother": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;

var Smoother = function() {
  var self = this;
  self.hasInitialState = false;
	
	self.doLogic = function() {
		if(!self.hasInitialState) return;
		
		var oldpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(self.position, self.oldposition, oldpositionDelta);
		vec3.add(self.networkposition, oldpositionDelta);
	
		var networkpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(self.networkposition, self.position, networkpositionDelta);
		vec3.scale(networkpositionDelta, 0.01);
	
		vec3.add(self.position, networkpositionDelta);
			
		var oldrotationDelta = self.rotationY - self.oldrotationy;	
		self.networkrotationY += oldrotationDelta;
			
		var networkrotationDelta = self.networkrotationY - self.rotationY;
		networkrotationDelta *= 0.1;
		self.rotationY += networkrotationDelta;
		
		self.oldposition = self.position;
		self.oldrotationy = self.rotationY; 
		
	};

	self.setSync = function(sync) {
    if(!self.hasInitialState || sync.force) {
	  		self.position = sync.position;
	  		self.rotationY = sync.rotationY;
			  self.hasInitialState = true;
		}

	  self.networkposition = sync.position;
	  self.networkrotationY = sync.rotationY; 
	  self.oldposition = self.position;
	  self.oldrotationy = self.rotationY; 

	};
};

exports.Smoother = Smoother;
}, "server/application": function(exports, require, module) {var ResourceManager = require('../core/resources').ResourceManager;
var Scene = require('../core/scene').Scene;
var Controller = require('../core/controller').Controller;
var ServerModelLoader = require('./servermodelloader').ServerModelLoader;
var ServerLandChunkModelLoader = require('./serverlandchunkloader').ServerLandChunkModelLoader;

ServerApp = function(){
  this.resources = new ResourceManager(this);
  this.scene = new Scene(this);
  this.controller = new Controller(this.scene);
  this.resources.addModelLoader(new ServerModelLoader());
  this.resources.addModelLoader(new ServerLandChunkModelLoader(this.resources));
};

ServerApp.start = function(){
    var controller = this.controller;
    this.intervalId = setInterval(function() {  controller.tick(); }, 1000 / 30);
};

ServerApp.stop = function(){
    clearInterval(this.intervalId);
};

exports.ServerApp = ServerApp;
}, "server/communication": function(exports, require, module) {io = require('socket.io');

MessageDispatcher = require('../core/messagedispatcher').MessageDispatcher;
EntityReceiver = require('../core/entityreceiver').EntityReceiver;
EventReceiver = require('./eventreceiver').EventReceiver;
ProxyReceiver = require('./proxyreceiver').ProxyReceiver;
ServerGameReceiver = require('./servergamereceiver').ServerGameReceiver;


ServerCommunication = function(app, server){
  var self = this;
  this.server = server;
  this.app = app;
  var listener = io.listen(server);

  listener.configure(function(){
      listener.set('log level', 1);
    });
  
  this.socket = listener.sockets;
  this.clients = {};

  this.dispatcher = new MessageDispatcher();

  this.dispatcher.addReceiver(new EventReceiver(this.app, this));
  this.dispatcher.addReceiver(new EntityReceiver(this.app));
  this.dispatcher.addReceiver(new ProxyReceiver(this.app, this));

  this.game = new ServerGameReceiver(this.app, this);
  this.dispatcher.addReceiver(this.game); 
  this.socket.on('connection', function(socket) { self.onConnection(socket); });
};

ServerCommunication.prototype.onConnection = function(socket) {
    this.clients[socket.id] = socket;
    this.hookClient(socket);
};

ServerCommunication.prototype.synchronise = function(){
   for(i in this.clients){
		this.syncPlayer(i);
   }
};

ServerCommunication.prototype.rejectClient = function(id) {
  var socket = this.clients[id];
  delete this.clients[id];  
  this.sendMessageToClient(socket, 'noauth');
};

ServerCommunication.prototype.hookClient = function(socket) {
    var server = this;
	  this.initializeClient(socket);
    socket.on('message', function(msg) { server.dispatchMessage(socket, msg); });    
    socket.on('disconnect', function() {server.unhookClient(socket);});
};

ServerCommunication.prototype.initializeClient = function(socket) {
	this.sendMessageToClient(socket, 'init', { id: socket.id });
};

ServerCommunication.prototype.unhookClient = function(socket) {
    this.game.removePlayer(socket.id);    
    delete this.clients[socket.id];  
};

ServerCommunication.prototype.dispatchMessage = function(socket, msg) {
    msg.data = msg.data || {};
    msg.data.source = socket.id;
    this.dispatcher.dispatch(msg);
};

ServerCommunication.prototype.sendMessage = function(command, data) {
	this.broadcast(command, data);
	this.dispatcher.dispatch({
		command: command,
		data: data
	});
};

ServerCommunication.prototype.sendMessageToClient = function(socket, command, data){
  try {
    socket.json.send({
        command: command,
        data: data
    });
  } catch(ex) {
    console.log('Failed to write to a socket for id: ' + socket.id + ', closing socket');
    this.unhookClient(socket);
  };
};

ServerCommunication.prototype.broadcast = function(command, data, from) {
  for(i in this.clients){
      if(from && this.clients[i].id === from) continue;
      this.sendMessageToClient(this.clients[i], command, data);   
  }
};

ServerCommunication.prototype.syncPlayerFull = function(id) {
	var socket = this.clients[id];
	var sceneData = this.game.getSceneState();
  this.sendMessageToClient(socket, 'syncscene', sceneData);
};

ServerCommunication.prototype.syncPlayer = function(id, force) {
	var socket = this.clients[id];
	var sync = this.game.getSyncForPlayer(id);
  if(!sync) return;

  this.broadcast('sync', {
       id: id,
       sync: sync,
       force : force || false
   });
};

exports.ServerCommunication = ServerCommunication;
}, "server/config": function(exports, require, module) {(function() {
  var fs;
  fs = require('fs');
  module.exports = function(file_name) {
    return JSON.parse(fs.readFileSync(file_name, 'utf8'))[ENV];
  };
}).call(this);
}, "server/data": function(exports, require, module) {var config = require('./config');

var url = config(DB_CONFIG_FILE)
var CouchClient = require('couch-client');
var db = CouchClient(url);

var bcrypt = require('bcrypt');  
var salt = bcrypt.gen_salt_sync(4);  

var Data = function() {
  var self = this;

  self.createUser = function(username, password, email, callback) {
     bcrypt.encrypt(password, salt, function(err, hash){
     db.save({
        type:"user", 
        username: username,
        password: hash,
        email: email             
      },
      callback);
    });
  };

  self.userExists = function(username, callback) {
   db.view('/hoverbattles/_design/users/_view/by_username', { key: username }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(false);
      else 
        callback(true);
    });
  };

  self.emailExists = function(email, callback) {
   db.view('/hoverbattles/_design/users/_view/by_email', { key: email }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0)   
        callback(false);
      else
       callback(true);
    });
  };

  self.validateCredentials = function(username, password, callback) {
   username = username || "";
   password = password || "";

   db.view('/hoverbattles/_design/users/_view/by_username', { key: username }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(false);
      else {
        var user = doc.rows[0].value;
        var result = bcrypt.compare_sync(password, user.password); 
        callback(result);
      }
    });
  };
  
  self.storeEvent = function(eventName, data) {
      db.save({
        type:"event",
        eventType: eventName,
        data: data           
      },
      function(err, data) {
        if(err) console.trace(err);
      });
  };
};

exports.Data = new Data();
}, "server/eventreceiver": function(exports, require, module) {var ForwardedEvents = [
  'missileLock',
  'fireMissile',
  'missileLost',
  'targetHit',
  'missileExpired',
  'entityDestroyed',
  'healthZeroed',
  'entityRevived',
  'entitySpawned',
  'playerJoined',
  'playerLeft',
  'playerNamed',
  'playerScoreChanged'
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var addEventProxy = function(event, type) {
     app.scene.on(event, function(data) {
        forwardEventForEntity(event, this.getId(), data);
     });
  };

  var forwardEventForEntity = function(event, id, data) {
    console.log('Forwarding ' + event + ' from ' + id);
    communication.sendMessage('entityEvent', {
      id: id,
      event: event,
      data: data
    });
  }; 

  self._entityEvent = function(msg) {
  };

  for(var i in ForwardedEvents) {
    var event = ForwardedEvents[i];
    addEventProxy(event);     
  }
};
}, "server/handler": function(exports, require, module) {exports.Handler = function() {
  var self = this;

  var routes = {};

  self.route = function(method, path, callback) {
    routes[path] = {
       callback: callback,
       method: method
    };
  };

  self.handle = function(req, res) {
    var route = findRoute(req.url);
    if(!route) return false;
    if(req.method !== route.method) return false;
    parseFormData(req, res, function() {
      route.callback(req, res);
    });
    return true;
  };

  var parseFormData = function(req, res, callback) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            req.body = qs.parse(body)             
            callback();
        });
    } 
    else callback();
  };

  var findRoute = function(url) {
    for(var i in routes) {
      if(url.indexOf(i) === 0) return routes[i];
    }
    return null;
  };
};
}, "server/identity": function(exports, require, module) {var Cookies = require('cookies');
var Keygrip = require('keygrip');
var config = require('./config');

var keys = config(KEYS_CONFIG_FILE);

exports.Identity = {
  verifyUsername: function(username, sign) {
    return self.keys().verify( username || "nope", sign || "nope" )
  },
  signIn: function(req, res, username) {
    self.cookies(req, res).set('username', username, {
      httpOnly: false
    });
    self.cookies(req, res).set('sign', self.keys().sign(username), {
      httpOnly: false
    });
  },
  isSignedIn: function(req, res) {
    var username = self.cookies(req, res).get('username');
    var sign = self.cookies(req, res).get('sign');
    return self.verifyUsername(username, sign);
  },
  keys: function() {
    return new Keygrip(keys);
  },
  cookies: function(req, res) {
    return new Cookies(req, res);
  }
};
var self = exports.Identity;
}, "server/landscapegeneration": function(exports, require, module) {exports.LandscapeGeneration = function(width, height, startX, startY, scale, maxHeight) {
  var self = this;
  var heightMap = new Array(width * height);

  for(var x = 0; x < width ; x++){
		for(var y = 0; y < height; y++) {
			var terrainHeight = (Math.sin((x + startX) / 32) + Math.sin((y + startY) / 32));
			heightMap[x + (y * width)] = Math.min(1.0, (terrainHeight + 1.0) / 2) * maxHeight;			
		}
	}

  self.create = function() {
    var data = generateTerrainData();
    return {
		  heights: heightMap,
      vertices: data.vertices,
      indices: data.indices,
      texturecoords: data.texturecoords
    };
  };

  var generateTerrainData = function() {
  
    var indexCount = (height - 1) * width * 2;
    var vertices = new Array(width* height * 2);
    var texturecoords = new Array(width * height * 2);
    var indices = new Array(indexCount);
     
    for(var y = 0 ; y < height ; y++ ) {
        for(var x = 0 ; x < width ; x++ ) {
        	var index = (x + y * width);
    
      		var vertexIndex = index * 2;
      		var texcoordsIndex = index * 2;    
          	    		
      		vertices[vertexIndex] = (x) * scale;
      		vertices[vertexIndex+1] = (y) * scale;
      
      		texturecoords[texcoordsIndex] = x / width;
      		texturecoords[texcoordsIndex+1] = y / height;
    	}
    }
    
    var topRowIndex = 0;
    var bottomRowIndex = width;
    
    var goingRight = true;
    var i = 0;
    
    // Trying to do an indexed triangle strip...
    // We go right until we reach the end of a row
    // And then come back again on the next row
    // And repeat until we run out of vertices
    while(i < indexCount)
    {
    	if(goingRight) {
    		indices[i++] = topRowIndex++;
    		indices[i++] = bottomRowIndex++;
    		
    		if(topRowIndex % width == 0){
    			goingRight = false;
    			topRowIndex = bottomRowIndex-1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	} else {
    		indices[i++] = topRowIndex--;
    		indices[i++] = bottomRowIndex--;
    
    		if((topRowIndex+1) % width == 0){
    			goingRight = true;
    			topRowIndex = bottomRowIndex+1;
    			bottomRowIndex = topRowIndex + width;				
    		}
    	}
    }	

    return {
      vertices: vertices,
      indices: indices,
      texturecoords: texturecoords     
    };
  }; 
};
}, "server/landscapehandler": function(exports, require, module) {path = require('path');
fs = require('fs');
querystring = require('querystring');
vec3 = require('../thirdparty/glmatrix').vec3;
gzip = require('gzip');
Handler = require('./handler').Handler;
LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;

exports.LandscapeHandler = function() {
  Handler.call(this);

  var self = this;
  var cache = {};

  self.route('GET', '/Landscape', function(req, res) {
    searchForLandscape(req, res, function(data) {
      res.setHeader("Content-Type", "text/javascript");
      res.setHeader("Content-Encoding", "gzip");
	    res.writeHead(200);
      res.write(data);
	    res.end();
    });
  });

  var searchForLandscape = function(req, res, success) {
      tryReadFromCache(req, res, success, tryReadFromFile);
  };

  var tryReadFromCache = function(req, res, success, next) {
    if(cache[req.url]) { 
      success(cache[req.url]);
    } else {
      next(req, res, success, generateFromQueryString);
    }
  };

  var tryReadFromFile = function(req, res, success, next) {
    fs.readFile('./cache/' + req.url, function(err, data) {
      if(err)
	      next(req, res, success);    
      else {
        cache[req.url] = data;
        success(data);
      }
    });
  };

  var generateFromQueryString = function(req, res, success) {
    var query =  querystring.parse(req.url);
    var maxHeight = parseInt(query.maxheight);
		var width = parseInt(query.width);
		var height = parseInt(query.height);
		var startX = parseInt(query.startx);
		var startY = parseInt(query.starty);
		var scale = parseInt(query.scale);

    var generator = new LandscapeGeneration(width, height, startX, startY, scale, maxHeight);
    var rawData = generator.create();

    convertRawDataIntoString(req, rawData, function(data) {
       writeToFile(req.url, data);
       success(data);
    });
  };  
  
  var convertRawDataIntoString = function(req, rawData, callback) {
		var model = JSON.stringify(rawData);
		gzip(model, function(err, zippeddata) {
			callback(zippeddata);    
		});
  };

  var writeToFile = function(filename, data) {
    fs.writeFile('./cache/' + filename, data);
  };
};
}, "server/persistencelistener": function(exports, require, module) {var data = require('./data').Data;

exports.PersistenceListener = function(scene) {
  var self = this;
  var playerNameMap = {};
  
  var onMissileFired = function(data) {
    storeEvent('missileFired', {
      targetuser: playerNameMap[data.targetid],
      targetsessionid: data.targetid,
      sourceuser: playerNameMap[data.sourceid],
      sourcesessionid: data.sourceid
    });
  };

  var onPlayerNamed = function(data) {
    playerNameMap[data.id] = data.username;
    storeEvent('playerStart', {
      username: data.username,
      sessionid: data.id
    });
  };

  var onPlayerKilled = function(data) {
    storeEvent('playerKilled', {
      targetuser: playerNameMap[data.targetid],
      targetsessionid: data.targetid,
      sourceuser: playerNameMap[data.sourceid],
      sourcesessionid: data.sourceid
    });
  };

  var storeEvent = function(eventName, eventData) {
    data.storeEvent(eventName, eventData);
  };

  scene.on('playerNamed', onPlayerNamed);
  scene.on('healthZeroed', onPlayerKilled);
  scene.on('fireMissile', onMissileFired);
};
}, "server/proxyreceiver": function(exports, require, module) {
var ProxyReceiver = function(app, communication) {
  this.app = app;
  this.communication = communication;
};

var proxiedMessages = [
	"_startUp",
	"_cancelUp",
	"_startForward",
	"_cancelForward",
	"_startBackward",
	"_cancelBackward",
	"_startLeft",
	"_cancelLeft",
	"_startRight",
	"_cancelRight"
];

ProxyReceiver.setupProxyMessageHandler = function(msgName) {
	ProxyReceiver.prototype[msgName] = function(data){
		this.communication.broadcast(msgName.substr(1), data, data.source);
	}	
}

for(var x = 0; x < proxiedMessages.length; x++) {
	var msg = proxiedMessages[x];
	ProxyReceiver.setupProxyMessageHandler(msg);
}



exports.ProxyReceiver = ProxyReceiver;
}, "server/servergamereceiver": function(exports, require, module) {HovercraftFactory = require('../entities/hovercraftfactory').HovercraftFactory;
MissileFactory = require('../entities/missilefactory').MissileFactory;
MissileFirer = require('../entities/missilefirer').MissileFirer;
Hovercraft = require('../entities/hovercraft').Hovercraft;
HovercraftSpawner = require('../entities/hovercraftspawner').HovercraftSpawner;
ScoreKeeper = require('../entities/scorekeeper').ScoreKeeper;
PersistenceListener = require('./persistencelistener').PersistenceListener;
Identity = require('./identity').Identity;

exports.ServerGameReceiver = function(app, communication) {
  var self = this;
  var guestCount = 0;
  var missileFirer = new MissileFirer(app, new MissileFactory());
  var spawner = HovercraftSpawner.Create(app.scene);
  var scoreKeeper = ScoreKeeper.Create(app.scene);
  var persistenceListener = new PersistenceListener(app.scene);

  self.removePlayer = function(id) {
    spawner.removePlayer(id);
  };

  self.getSyncForPlayer = function(id) {
    var craft = app.scene.getEntity(id);
	  if(craft)
	    return craft.getSync();
    return null;
  };

  self.getSceneState = function() {
	  var state = {};
	  state.craft = [];
    state.others = [];

    app.scene.forEachEntity(function(entity) {
      if(entity.is(Hovercraft)) {
		    var craftState = {};
		    craftState.id = entity.getId();
		    craftState.sync = entity.getSync();
		    state.craft.push(craftState);
      } else if(entity.getSync) {
        var otherState = {};
        otherState.id = entity.getId();
        otherState.sync = entity.getSync();
        state.others.push(otherState);
      }
    });

	  return state;	
  };
  
  self._ready = function(data) {
    if(data.username) {
      if(!Identity.verifyUsername(data.username, data.sign)) {
        communication.rejectClient(data.source);
        return;
      }
    } else {
      data.username = 'guest-' + guestCount++;
    }; 

    spawner.namePlayer(data.source, data.username);
    spawner.createPlayer(data.source);
	  communication.syncPlayerFull(data.source);
  };

  self._fireRequest = function(data) {
    app.scene.withEntity(data.id, function(entity) {
      entity.tryFireMissile();
    });
  };
};
}, "server/serverlandchunkloader": function(exports, require, module) {var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var LandChunk = require('../entities/landchunk').LandChunk;
var LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;


exports.ServerLandChunkModelLoader = function(resources) {
  var self = this;

  self.handles = function(path){
    return path.indexOf('chunk_') > -1;
  };

  self.load = function(id, callback) {
    var data = JSON.parse(id.substr(6, id.length - 6));
        
    var model = new LandChunk(data.width, data.height, data.maxHeight, data.scale, data.x, data.y);   
    var data = createTerrainChunk(data.width, data.height, data.x, data.y, data.scale, data.maxHeight);
    model.setData(data);
    callback();
    
    return model;
  };
  
  var createTerrainChunk = function(width, height, x, y, scale, maxHeight) {
    var generator = new LandscapeGeneration(width, height, x, y, scale, maxHeight);
    return generator.create();
  };
}; 
}, "server/servermodelloader": function(exports, require, module) {var Model = require('../core/model').Model;
var fs = require('fs');

var ServerModelLoader = function(){
};

ServerModelLoader.prototype.handles = function(path){
  return path.indexOf('.json') > -1;  
};

ServerModelLoader.prototype.load = function(path, callback) {
    var model = new Model();
    var name = path.substr(0, path.length - 5);
    var loader = this;
    
    fs.readFile('./site/app/data/models/' + path, function(err, data) {        
        var modelData = JSON.parse(data);     
        model.setData(modelData);    
       callback();
    });
    return model;    
};

exports.ServerModelLoader = ServerModelLoader;
}, "server/services": function(exports, require, module) {var qs = require('querystring');
var Identity = require('./identity').Identity;
var data = require('./data').Data;
var Handler = require('./handler').Handler;

exports.Services = function() {
  Handler.call(this);
  var self = this;

  self.route('POST', '/services/register', function(req, res) { 
      var username = req.body.username;
      var password = req.body.password;
      var email = req.body.email;

      var userValidation = [
        function(next) {
          if(!username || username.length < 6 || username.length > 15)
            writeValidationError(req, res, 'Username is required, 6 <= length <= 15');
          else 
            next();
        },
        function(next) {
          if(username.toLowerCase().indexOf('guest') >= 0)
            writeValidationError(req, res, 'Guest is a reserved name');
          else 
            next();
        },
        function(next) {
          if(!password)
            writeValidationError(req, res, 'Password is required, it can be whatever though');
          else next();
        },
       function(next) {
        data.userExists(username, function(exists) {
          if(exists)
            writeValidationError(req, res, "Username already exists, please choose another yo'");
          else next();
        });
       },
       function(next) {
        if(!email) { next(); return; }
        data.emailExists(email, function(exists) {
          if(exists) 
            writeValidationError(req, res, "E-mail already exists, tell me on Twitter if you've forgotten your password");
          else next();
        });
       }];

      validateInput(userValidation, function() {
        data.createUser(username, password, email, function(err, doc) {
          setCookieForUser(req, res, username);     
			    res.writeHead(200, "Content-Type: application/json");
			    res.write(JSON.stringify({
            success: true
          }));
			    res.end();
        }); 
      });
  });

  self.route('POST', '/services/login', function(req, res) {
      var username = req.body.username;
      var password = req.body.password;

      data.validateCredentials(username, password, function(valid) {
        if(!valid) 
          writeValidationError(req, res, "That didn't work, try again");
        else {
          // Set the cookie so we can get gaming
          setCookieForUser(req, res, username);      

		      res.writeHead(200, "Content-Type: application/json");
		      res.write(JSON.stringify({
            success: true
          }));
		      res.end();
        }
      });
  });

  var validateInput = function(rules, callback) {
    runValidationRule(0, rules, callback);   
  };

  var runValidationRule = function(index, rules, callback) {
    rules[index](function() {
      if(++index < rules.length) runValidationRule(index, rules, callback);
      else callback();
    })   
  };

  writeValidationError = function(req, res, feedback) {
		res.writeHead(200, "Content-Type: application/json");
		res.write(JSON.stringify({
      success: false,
      feedback: feedback
    }));
		res.end();
  };

  var setCookieForUser = function(req, res, username) {
    Identity.signIn(req, res, username);
  };
};
}, "server/shadergeneration": function(exports, require, module) {path = require('path');
fs = require('fs');

exports.ShaderGeneration = function(dir) {
  var self = this;
  var shaders = {};

  self.create = function(callback) {
	  fs.readdir(dir, function(err, files){
		  var workRemaining = files.length;
		  for(var i in files){
			 readFile(files[i], function() {
          workRemaining--;
          if(workRemaining === 0)
            dumpShadersToOutput(callback);
       });			
		  };					
	  });
  };

  var dumpShadersToOutput = function(callback) {
	  var shaderData = "var Cache = Cache || {};\n";
	  shaderData += "Cache.Shaders = \n";
	  shaderData += JSON.stringify(shaders);
	  shaderData += ";";
    callback(shaderData);
  };

  var readFile = function(file, callback) {
	  var components = file.split('.');
	  var shaderName = components[0];
	  var shaderType = components[1];

    processShader(file, shaderName, shaderType, callback);
  };

  var processShader = function(file, shaderName, shaderType, callback) {
    ensureShaderExists(shaderName);		  
    shaderType = normaliseShaderType(shaderType);
	  readShaderFromFile(file, shaderName, shaderType, callback);
  };

  var ensureShaderExists = function(shaderName) {
    if(!shaders[shaderName])
	    shaders[shaderName] = {};
  };

  var normaliseShaderType = function(shaderType) {
	  if(shaderType.indexOf("fragment") === 0)
		  return "Fragment";
	  else
		 return "Shader";	
  
  };

  var readShaderFromFile = function(file, shaderName, shaderType, callback) {
	  var shaderFile = path.join(dir, file);
	  fs.readFile(shaderFile, "utf8", function(err, data) {
		  shaders[shaderName][shaderType] = data;
      callback();
	  });								
  };
};
}, "thirdparty/glmatrix": function(exports, require, module) {/* 
 * glMatrix.js - High performance matrix and vector operations for WebGL
 * version 0.9.6
 */
 
/*
 * Copyright (c) 2011 Brandon Jones
 *
 * This software is provided 'as-is', without any express or implied
 * warranty. In no event will the authors be held liable for any damages
 * arising from the use of this software.
 *
 * Permission is granted to anyone to use this software for any purpose,
 * including commercial applications, and to alter it and redistribute it
 * freely, subject to the following restrictions:
 *
 *    1. The origin of this software must not be misrepresented; you must not
 *    claim that you wrote the original software. If you use this software
 *    in a product, an acknowledgment in the product documentation would be
 *    appreciated but is not required.
 *
 *    2. Altered source versions must be plainly marked as such, and must not
 *    be misrepresented as being the original software.
 *
 *    3. This notice may not be removed or altered from any source
 *    distribution.
 */

// Fallback for systems that don't support WebGL
if(typeof Float32Array != 'undefined') {
    glMatrixArrayType = Float32Array;
} else if(typeof WebGLFloatArray != 'undefined') {
	glMatrixArrayType = WebGLFloatArray; // This is officially deprecated and should dissapear in future revisions.
} else {
	glMatrixArrayType = Array;
}

/*
 * vec3 - 3 Dimensional Vector
 */
var vec3 = {};

/*
 * vec3.create
 * Creates a new instance of a vec3 using the default array type
 * Any javascript array containing at least 3 numeric elements can serve as a vec3
 *
 * Params:
 * vec - Optional, vec3 containing values to initialize with
 *
 * Returns:
 * New vec3
 */
vec3.create = function(vec) {
	var dest = new glMatrixArrayType(3);
	
	if(vec) {
		dest[0] = vec[0];
		dest[1] = vec[1];
		dest[2] = vec[2];
	}
	
	return dest;
};

/*
 * vec3.set
 * Copies the values of one vec3 to another
 *
 * Params:
 * vec - vec3 containing values to copy
 * dest - vec3 receiving copied values
 *
 * Returns:
 * dest
 */
vec3.set = function(vec, dest) {
	dest[0] = vec[0];
	dest[1] = vec[1];
	dest[2] = vec[2];
	
	return dest;
};

/*
 * vec3.add
 * Performs a vector addition
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.add = function(vec, vec2, dest) {
	if(!dest || vec == dest) {
		vec[0] += vec2[0];
		vec[1] += vec2[1];
		vec[2] += vec2[2];
		return vec;
	}
	
	dest[0] = vec[0] + vec2[0];
	dest[1] = vec[1] + vec2[1];
	dest[2] = vec[2] + vec2[2];
	return dest;
};

/*
 * vec3.subtract
 * Performs a vector subtraction
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.subtract = function(vec, vec2, dest) {
	if(!dest || vec == dest) {
		vec[0] -= vec2[0];
		vec[1] -= vec2[1];
		vec[2] -= vec2[2];
		return vec;
	}
	
	dest[0] = vec[0] - vec2[0];
	dest[1] = vec[1] - vec2[1];
	dest[2] = vec[2] - vec2[2];
	return dest;
};

/*
 * vec3.negate
 * Negates the components of a vec3
 *
 * Params:
 * vec - vec3 to negate
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.negate = function(vec, dest) {
	if(!dest) { dest = vec; }
	
	dest[0] = -vec[0];
	dest[1] = -vec[1];
	dest[2] = -vec[2];
	return dest;
};

/*
 * vec3.scale
 * Multiplies the components of a vec3 by a scalar value
 *
 * Params:
 * vec - vec3 to scale
 * val - Numeric value to scale by
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.scale = function(vec, val, dest) {
	if(!dest || vec == dest) {
		vec[0] *= val;
		vec[1] *= val;
		vec[2] *= val;
		return vec;
	}
	
	dest[0] = vec[0]*val;
	dest[1] = vec[1]*val;
	dest[2] = vec[2]*val;
	return dest;
};

/*
 * vec3.normalize
 * Generates a unit vector of the same direction as the provided vec3
 * If vector length is 0, returns [0, 0, 0]
 *
 * Params:
 * vec - vec3 to normalize
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.normalize = function(vec, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var len = Math.sqrt(x*x + y*y + z*z);
	
	if (!len) {
		dest[0] = 0;
		dest[1] = 0;
		dest[2] = 0;
		return dest;
	} else if (len == 1) {
		dest[0] = x;
		dest[1] = y;
		dest[2] = z;
		return dest;
	}
	
	len = 1 / len;
	dest[0] = x*len;
	dest[1] = y*len;
	dest[2] = z*len;
	return dest;
};

/*
 * vec3.cross
 * Generates the cross product of two vec3s
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.cross = function(vec, vec2, dest){
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var x2 = vec2[0], y2 = vec2[1], z2 = vec2[2];
	
	dest[0] = y*z2 - z*y2;
	dest[1] = z*x2 - x*z2;
	dest[2] = x*y2 - y*x2;
	return dest;
};

/*
 * vec3.length
 * Caclulates the length of a vec3
 *
 * Params:
 * vec - vec3 to calculate length of
 *
 * Returns:
 * Length of vec
 */
vec3.length = function(vec){
	var x = vec[0], y = vec[1], z = vec[2];
	return Math.sqrt(x*x + y*y + z*z);
};

/*
 * vec3.dot
 * Caclulates the dot product of two vec3s
 *
 * Params:
 * vec - vec3, first operand
 * vec2 - vec3, second operand
 *
 * Returns:
 * Dot product of vec and vec2
 */
vec3.dot = function(vec, vec2){
	return vec[0]*vec2[0] + vec[1]*vec2[1] + vec[2]*vec2[2];
};

/*
 * vec3.direction
 * Generates a unit vector pointing from one vector to another
 *
 * Params:
 * vec - origin vec3
 * vec2 - vec3 to point to
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.direction = function(vec, vec2, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0] - vec2[0];
	var y = vec[1] - vec2[1];
	var z = vec[2] - vec2[2];
	
	var len = Math.sqrt(x*x + y*y + z*z);
	if (!len) { 
		dest[0] = 0; 
		dest[1] = 0; 
		dest[2] = 0;
		return dest; 
	}
	
	len = 1 / len;
	dest[0] = x * len; 
	dest[1] = y * len; 
	dest[2] = z * len;
	return dest; 
};

/*
 * vec3.lerp
 * Performs a linear interpolation between two vec3
 *
 * Params:
 * vec - vec3, first vector
 * vec2 - vec3, second vector
 * lerp - interpolation amount between the two inputs
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
vec3.lerp = function(vec, vec2, lerp, dest){
    if(!dest) { dest = vec; }
    
    dest[0] = vec[0] + lerp * (vec2[0] - vec[0]);
    dest[1] = vec[1] + lerp * (vec2[1] - vec[1]);
    dest[2] = vec[2] + lerp * (vec2[2] - vec[2]);
    
    return dest;
}

/*
 * vec3.str
 * Returns a string representation of a vector
 *
 * Params:
 * vec - vec3 to represent as a string
 *
 * Returns:
 * string representation of vec
 */
vec3.str = function(vec) {
	return '[' + vec[0] + ', ' + vec[1] + ', ' + vec[2] + ']'; 
};

/*
 * mat3 - 3x3 Matrix
 */
var mat3 = {};

/*
 * mat3.create
 * Creates a new instance of a mat3 using the default array type
 * Any javascript array containing at least 9 numeric elements can serve as a mat3
 *
 * Params:
 * mat - Optional, mat3 containing values to initialize with
 *
 * Returns:
 * New mat3
 */
mat3.create = function(mat) {
	var dest = new glMatrixArrayType(9);
	
	if(mat) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
	}
	
	return dest;
};

/*
 * mat3.set
 * Copies the values of one mat3 to another
 *
 * Params:
 * mat - mat3 containing values to copy
 * dest - mat3 receiving copied values
 *
 * Returns:
 * dest
 */
mat3.set = function(mat, dest) {
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	return dest;
};

/*
 * mat3.identity
 * Sets a mat3 to an identity matrix
 *
 * Params:
 * dest - mat3 to set
 *
 * Returns:
 * dest
 */
mat3.identity = function(dest) {
	dest[0] = 1;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 1;
	dest[5] = 0;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 1;
	return dest;
};

/*
 * mat4.transpose
 * Transposes a mat3 (flips the values over the diagonal)
 *
 * Params:
 * mat - mat3 to transpose
 * dest - Optional, mat3 receiving transposed values. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat3.transpose = function(mat, dest) {
	// If we are transposing ourselves we can skip a few steps but have to cache some values
	if(!dest || mat == dest) { 
		var a01 = mat[1], a02 = mat[2];
		var a12 = mat[5];
		
        mat[1] = mat[3];
        mat[2] = mat[6];
        mat[3] = a01;
        mat[5] = mat[7];
        mat[6] = a02;
        mat[7] = a12;
		return mat;
	}
	
	dest[0] = mat[0];
	dest[1] = mat[3];
	dest[2] = mat[6];
	dest[3] = mat[1];
	dest[4] = mat[4];
	dest[5] = mat[7];
	dest[6] = mat[2];
	dest[7] = mat[5];
	dest[8] = mat[8];
	return dest;
};

/*
 * mat3.toMat4
 * Copies the elements of a mat3 into the upper 3x3 elements of a mat4
 *
 * Params:
 * mat - mat3 containing values to copy
 * dest - Optional, mat4 receiving copied values
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat3.toMat4 = function(mat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = 0;

	dest[4] = mat[3];
	dest[5] = mat[4];
	dest[6] = mat[5];
	dest[7] = 0;

	dest[8] = mat[6];
	dest[9] = mat[7];
	dest[10] = mat[8];
	dest[11] = 0;

	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
}

/*
 * mat3.str
 * Returns a string representation of a mat3
 *
 * Params:
 * mat - mat3 to represent as a string
 *
 * Returns:
 * string representation of mat
 */
mat3.str = function(mat) {
	return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + 
		', ' + mat[3] + ', '+ mat[4] + ', ' + mat[5] + 
		', ' + mat[6] + ', ' + mat[7] + ', '+ mat[8] + ']';
};

/*
 * mat4 - 4x4 Matrix
 */
var mat4 = {};

/*
 * mat4.create
 * Creates a new instance of a mat4 using the default array type
 * Any javascript array containing at least 16 numeric elements can serve as a mat4
 *
 * Params:
 * mat - Optional, mat4 containing values to initialize with
 *
 * Returns:
 * New mat4
 */
mat4.create = function(mat) {
	var dest = new glMatrixArrayType(16);
	
	if(mat) {
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	return dest;
};

/*
 * mat4.set
 * Copies the values of one mat4 to another
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - mat4 receiving copied values
 *
 * Returns:
 * dest
 */
mat4.set = function(mat, dest) {
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	dest[9] = mat[9];
	dest[10] = mat[10];
	dest[11] = mat[11];
	dest[12] = mat[12];
	dest[13] = mat[13];
	dest[14] = mat[14];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.identity
 * Sets a mat4 to an identity matrix
 *
 * Params:
 * dest - mat4 to set
 *
 * Returns:
 * dest
 */
mat4.identity = function(dest) {
	dest[0] = 1;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = 1;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 0;
	dest[9] = 0;
	dest[10] = 1;
	dest[11] = 0;
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	return dest;
};

/*
 * mat4.transpose
 * Transposes a mat4 (flips the values over the diagonal)
 *
 * Params:
 * mat - mat4 to transpose
 * dest - Optional, mat4 receiving transposed values. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat4.transpose = function(mat, dest) {
	// If we are transposing ourselves we can skip a few steps but have to cache some values
	if(!dest || mat == dest) { 
		var a01 = mat[1], a02 = mat[2], a03 = mat[3];
		var a12 = mat[6], a13 = mat[7];
		var a23 = mat[11];
		
		mat[1] = mat[4];
		mat[2] = mat[8];
		mat[3] = mat[12];
		mat[4] = a01;
		mat[6] = mat[9];
		mat[7] = mat[13];
		mat[8] = a02;
		mat[9] = a12;
		mat[11] = mat[14];
		mat[12] = a03;
		mat[13] = a13;
		mat[14] = a23;
		return mat;
	}
	
	dest[0] = mat[0];
	dest[1] = mat[4];
	dest[2] = mat[8];
	dest[3] = mat[12];
	dest[4] = mat[1];
	dest[5] = mat[5];
	dest[6] = mat[9];
	dest[7] = mat[13];
	dest[8] = mat[2];
	dest[9] = mat[6];
	dest[10] = mat[10];
	dest[11] = mat[14];
	dest[12] = mat[3];
	dest[13] = mat[7];
	dest[14] = mat[11];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.determinant
 * Calculates the determinant of a mat4
 *
 * Params:
 * mat - mat4 to calculate determinant of
 *
 * Returns:
 * determinant of mat
 */
mat4.determinant = function(mat) {
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];

	return	a30*a21*a12*a03 - a20*a31*a12*a03 - a30*a11*a22*a03 + a10*a31*a22*a03 +
			a20*a11*a32*a03 - a10*a21*a32*a03 - a30*a21*a02*a13 + a20*a31*a02*a13 +
			a30*a01*a22*a13 - a00*a31*a22*a13 - a20*a01*a32*a13 + a00*a21*a32*a13 +
			a30*a11*a02*a23 - a10*a31*a02*a23 - a30*a01*a12*a23 + a00*a31*a12*a23 +
			a10*a01*a32*a23 - a00*a11*a32*a23 - a20*a11*a02*a33 + a10*a21*a02*a33 +
			a20*a01*a12*a33 - a00*a21*a12*a33 - a10*a01*a22*a33 + a00*a11*a22*a33;
};

/*
 * mat4.inverse
 * Calculates the inverse matrix of a mat4
 *
 * Params:
 * mat - mat4 to calculate inverse of
 * dest - Optional, mat4 receiving inverse matrix. If not specified result is written to mat
 *
 * Returns:
 * dest is specified, mat otherwise
 */
mat4.inverse = function(mat, dest) {
	if(!dest) { dest = mat; }
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
	
	var b00 = a00*a11 - a01*a10;
	var b01 = a00*a12 - a02*a10;
	var b02 = a00*a13 - a03*a10;
	var b03 = a01*a12 - a02*a11;
	var b04 = a01*a13 - a03*a11;
	var b05 = a02*a13 - a03*a12;
	var b06 = a20*a31 - a21*a30;
	var b07 = a20*a32 - a22*a30;
	var b08 = a20*a33 - a23*a30;
	var b09 = a21*a32 - a22*a31;
	var b10 = a21*a33 - a23*a31;
	var b11 = a22*a33 - a23*a32;
	
	// Calculate the determinant (inlined to avoid double-caching)
	var invDet = 1/(b00*b11 - b01*b10 + b02*b09 + b03*b08 - b04*b07 + b05*b06);
	
	dest[0] = (a11*b11 - a12*b10 + a13*b09)*invDet;
	dest[1] = (-a01*b11 + a02*b10 - a03*b09)*invDet;
	dest[2] = (a31*b05 - a32*b04 + a33*b03)*invDet;
	dest[3] = (-a21*b05 + a22*b04 - a23*b03)*invDet;
	dest[4] = (-a10*b11 + a12*b08 - a13*b07)*invDet;
	dest[5] = (a00*b11 - a02*b08 + a03*b07)*invDet;
	dest[6] = (-a30*b05 + a32*b02 - a33*b01)*invDet;
	dest[7] = (a20*b05 - a22*b02 + a23*b01)*invDet;
	dest[8] = (a10*b10 - a11*b08 + a13*b06)*invDet;
	dest[9] = (-a00*b10 + a01*b08 - a03*b06)*invDet;
	dest[10] = (a30*b04 - a31*b02 + a33*b00)*invDet;
	dest[11] = (-a20*b04 + a21*b02 - a23*b00)*invDet;
	dest[12] = (-a10*b09 + a11*b07 - a12*b06)*invDet;
	dest[13] = (a00*b09 - a01*b07 + a02*b06)*invDet;
	dest[14] = (-a30*b03 + a31*b01 - a32*b00)*invDet;
	dest[15] = (a20*b03 - a21*b01 + a22*b00)*invDet;
	
	return dest;
};

/*
 * mat4.toRotationMat
 * Copies the upper 3x3 elements of a mat4 into another mat4
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - Optional, mat4 receiving copied values
 *
 * Returns:
 * dest is specified, a new mat4 otherwise
 */
mat4.toRotationMat = function(mat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[3];
	dest[4] = mat[4];
	dest[5] = mat[5];
	dest[6] = mat[6];
	dest[7] = mat[7];
	dest[8] = mat[8];
	dest[9] = mat[9];
	dest[10] = mat[10];
	dest[11] = mat[11];
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
};

/*
 * mat4.toMat3
 * Copies the upper 3x3 elements of a mat4 into a mat3
 *
 * Params:
 * mat - mat4 containing values to copy
 * dest - Optional, mat3 receiving copied values
 *
 * Returns:
 * dest is specified, a new mat3 otherwise
 */
mat4.toMat3 = function(mat, dest) {
	if(!dest) { dest = mat3.create(); }
	
	dest[0] = mat[0];
	dest[1] = mat[1];
	dest[2] = mat[2];
	dest[3] = mat[4];
	dest[4] = mat[5];
	dest[5] = mat[6];
	dest[6] = mat[8];
	dest[7] = mat[9];
	dest[8] = mat[10];
	
	return dest;
};

/*
 * mat4.toInverseMat3
 * Calculates the inverse of the upper 3x3 elements of a mat4 and copies the result into a mat3
 * The resulting matrix is useful for calculating transformed normals
 *
 * Params:
 * mat - mat4 containing values to invert and copy
 * dest - Optional, mat3 receiving values
 *
 * Returns:
 * dest is specified, a new mat3 otherwise
 */
mat4.toInverseMat3 = function(mat, dest) {
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10];
	
	var b01 = a22*a11-a12*a21;
	var b11 = -a22*a10+a12*a20;
	var b21 = a21*a10-a11*a20;
		
	var d = a00*b01 + a01*b11 + a02*b21;
	if (!d) { return null; }
	var id = 1/d;
	
	if(!dest) { dest = mat3.create(); }
	
	dest[0] = b01*id;
	dest[1] = (-a22*a01 + a02*a21)*id;
	dest[2] = (a12*a01 - a02*a11)*id;
	dest[3] = b11*id;
	dest[4] = (a22*a00 - a02*a20)*id;
	dest[5] = (-a12*a00 + a02*a10)*id;
	dest[6] = b21*id;
	dest[7] = (-a21*a00 + a01*a20)*id;
	dest[8] = (a11*a00 - a01*a10)*id;
	
	return dest;
};

/*
 * mat4.multiply
 * Performs a matrix multiplication
 *
 * Params:
 * mat - mat4, first operand
 * mat2 - mat4, second operand
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.multiply = function(mat, mat2, dest) {
	if(!dest) { dest = mat }
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	var a30 = mat[12], a31 = mat[13], a32 = mat[14], a33 = mat[15];
	
	var b00 = mat2[0], b01 = mat2[1], b02 = mat2[2], b03 = mat2[3];
	var b10 = mat2[4], b11 = mat2[5], b12 = mat2[6], b13 = mat2[7];
	var b20 = mat2[8], b21 = mat2[9], b22 = mat2[10], b23 = mat2[11];
	var b30 = mat2[12], b31 = mat2[13], b32 = mat2[14], b33 = mat2[15];
	
	dest[0] = b00*a00 + b01*a10 + b02*a20 + b03*a30;
	dest[1] = b00*a01 + b01*a11 + b02*a21 + b03*a31;
	dest[2] = b00*a02 + b01*a12 + b02*a22 + b03*a32;
	dest[3] = b00*a03 + b01*a13 + b02*a23 + b03*a33;
	dest[4] = b10*a00 + b11*a10 + b12*a20 + b13*a30;
	dest[5] = b10*a01 + b11*a11 + b12*a21 + b13*a31;
	dest[6] = b10*a02 + b11*a12 + b12*a22 + b13*a32;
	dest[7] = b10*a03 + b11*a13 + b12*a23 + b13*a33;
	dest[8] = b20*a00 + b21*a10 + b22*a20 + b23*a30;
	dest[9] = b20*a01 + b21*a11 + b22*a21 + b23*a31;
	dest[10] = b20*a02 + b21*a12 + b22*a22 + b23*a32;
	dest[11] = b20*a03 + b21*a13 + b22*a23 + b23*a33;
	dest[12] = b30*a00 + b31*a10 + b32*a20 + b33*a30;
	dest[13] = b30*a01 + b31*a11 + b32*a21 + b33*a31;
	dest[14] = b30*a02 + b31*a12 + b32*a22 + b33*a32;
	dest[15] = b30*a03 + b31*a13 + b32*a23 + b33*a33;
	
	return dest;
};

/*
 * mat4.multiplyVec3
 * Transforms a vec3 with the given matrix
 * 4th vector component is implicitly '1'
 *
 * Params:
 * mat - mat4 to transform the vector with
 * vec - vec3 to transform
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
mat4.multiplyVec3 = function(mat, vec, dest) {
	if(!dest) { dest = vec }
	
	var x = vec[0], y = vec[1], z = vec[2];
	
	dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
	dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
	dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
	
	return dest;
};

/*
 * mat4.multiplyVec4
 * Transforms a vec4 with the given matrix
 *
 * Params:
 * mat - mat4 to transform the vector with
 * vec - vec4 to transform
 * dest - Optional, vec4 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
mat4.multiplyVec4 = function(mat, vec, dest) {
	if(!dest) { dest = vec }
	
	var x = vec[0], y = vec[1], z = vec[2], w = vec[3];
	
	dest[0] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12]*w;
	dest[1] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13]*w;
	dest[2] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14]*w;
	dest[3] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15]*w;
	
	return dest;
};

/*
 * mat4.translate
 * Translates a matrix by the given vector
 *
 * Params:
 * mat - mat4 to translate
 * vec - vec3 specifying the translation
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.translate = function(mat, vec, dest) {
	var x = vec[0], y = vec[1], z = vec[2];
	
	if(!dest || mat == dest) {
		mat[12] = mat[0]*x + mat[4]*y + mat[8]*z + mat[12];
		mat[13] = mat[1]*x + mat[5]*y + mat[9]*z + mat[13];
		mat[14] = mat[2]*x + mat[6]*y + mat[10]*z + mat[14];
		mat[15] = mat[3]*x + mat[7]*y + mat[11]*z + mat[15];
		return mat;
	}
	
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	dest[0] = a00;
	dest[1] = a01;
	dest[2] = a02;
	dest[3] = a03;
	dest[4] = a10;
	dest[5] = a11;
	dest[6] = a12;
	dest[7] = a13;
	dest[8] = a20;
	dest[9] = a21;
	dest[10] = a22;
	dest[11] = a23;
	
	dest[12] = a00*x + a10*y + a20*z + mat[12];
	dest[13] = a01*x + a11*y + a21*z + mat[13];
	dest[14] = a02*x + a12*y + a22*z + mat[14];
	dest[15] = a03*x + a13*y + a23*z + mat[15];
	return dest;
};

/*
 * mat4.scale
 * Scales a matrix by the given vector
 *
 * Params:
 * mat - mat4 to scale
 * vec - vec3 specifying the scale for each axis
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.scale = function(mat, vec, dest) {
	var x = vec[0], y = vec[1], z = vec[2];
	
	if(!dest || mat == dest) {
		mat[0] *= x;
		mat[1] *= x;
		mat[2] *= x;
		mat[3] *= x;
		mat[4] *= y;
		mat[5] *= y;
		mat[6] *= y;
		mat[7] *= y;
		mat[8] *= z;
		mat[9] *= z;
		mat[10] *= z;
		mat[11] *= z;
		return mat;
	}
	
	dest[0] = mat[0]*x;
	dest[1] = mat[1]*x;
	dest[2] = mat[2]*x;
	dest[3] = mat[3]*x;
	dest[4] = mat[4]*y;
	dest[5] = mat[5]*y;
	dest[6] = mat[6]*y;
	dest[7] = mat[7]*y;
	dest[8] = mat[8]*z;
	dest[9] = mat[9]*z;
	dest[10] = mat[10]*z;
	dest[11] = mat[11]*z;
	dest[12] = mat[12];
	dest[13] = mat[13];
	dest[14] = mat[14];
	dest[15] = mat[15];
	return dest;
};

/*
 * mat4.rotate
 * Rotates a matrix by the given angle around the specified axis
 * If rotating around a primary axis (X,Y,Z) one of the specialized rotation functions should be used instead for performance
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * axis - vec3 representing the axis to rotate around 
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotate = function(mat, angle, axis, dest) {
	var x = axis[0], y = axis[1], z = axis[2];
	var len = Math.sqrt(x*x + y*y + z*z);
	if (!len) { return null; }
	if (len != 1) {
		len = 1 / len;
		x *= len; 
		y *= len; 
		z *= len;
	}
	
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	var t = 1-c;
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	// Construct the elements of the rotation matrix
	var b00 = x*x*t + c, b01 = y*x*t + z*s, b02 = z*x*t - y*s;
	var b10 = x*y*t - z*s, b11 = y*y*t + c, b12 = z*y*t + x*s;
	var b20 = x*z*t + y*s, b21 = y*z*t - x*s, b22 = z*z*t + c;
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform rotation-specific matrix multiplication
	dest[0] = a00*b00 + a10*b01 + a20*b02;
	dest[1] = a01*b00 + a11*b01 + a21*b02;
	dest[2] = a02*b00 + a12*b01 + a22*b02;
	dest[3] = a03*b00 + a13*b01 + a23*b02;
	
	dest[4] = a00*b10 + a10*b11 + a20*b12;
	dest[5] = a01*b10 + a11*b11 + a21*b12;
	dest[6] = a02*b10 + a12*b11 + a22*b12;
	dest[7] = a03*b10 + a13*b11 + a23*b12;
	
	dest[8] = a00*b20 + a10*b21 + a20*b22;
	dest[9] = a01*b20 + a11*b21 + a21*b22;
	dest[10] = a02*b20 + a12*b21 + a22*b22;
	dest[11] = a03*b20 + a13*b21 + a23*b22;
	return dest;
};

/*
 * mat4.rotateX
 * Rotates a matrix by the given angle around the X axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateX = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];

	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
		dest[0] = mat[0];
		dest[1] = mat[1];
		dest[2] = mat[2];
		dest[3] = mat[3];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[4] = a10*c + a20*s;
	dest[5] = a11*c + a21*s;
	dest[6] = a12*c + a22*s;
	dest[7] = a13*c + a23*s;
	
	dest[8] = a10*-s + a20*c;
	dest[9] = a11*-s + a21*c;
	dest[10] = a12*-s + a22*c;
	dest[11] = a13*-s + a23*c;
	return dest;
};

/*
 * mat4.rotateY
 * Rotates a matrix by the given angle around the Y axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateY = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a20 = mat[8], a21 = mat[9], a22 = mat[10], a23 = mat[11];
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged rows
		dest[4] = mat[4];
		dest[5] = mat[5];
		dest[6] = mat[6];
		dest[7] = mat[7];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[0] = a00*c + a20*-s;
	dest[1] = a01*c + a21*-s;
	dest[2] = a02*c + a22*-s;
	dest[3] = a03*c + a23*-s;
	
	dest[8] = a00*s + a20*c;
	dest[9] = a01*s + a21*c;
	dest[10] = a02*s + a22*c;
	dest[11] = a03*s + a23*c;
	return dest;
};

/*
 * mat4.rotateZ
 * Rotates a matrix by the given angle around the Z axis
 *
 * Params:
 * mat - mat4 to rotate
 * angle - angle (in radians) to rotate
 * dest - Optional, mat4 receiving operation result. If not specified result is written to mat
 *
 * Returns:
 * dest if specified, mat otherwise
 */
mat4.rotateZ = function(mat, angle, dest) {
	var s = Math.sin(angle);
	var c = Math.cos(angle);
	
	// Cache the matrix values (makes for huge speed increases!)
	var a00 = mat[0], a01 = mat[1], a02 = mat[2], a03 = mat[3];
	var a10 = mat[4], a11 = mat[5], a12 = mat[6], a13 = mat[7];
	
	if(!dest) { 
		dest = mat 
	} else if(mat != dest) { // If the source and destination differ, copy the unchanged last row
		dest[8] = mat[8];
		dest[9] = mat[9];
		dest[10] = mat[10];
		dest[11] = mat[11];
		
		dest[12] = mat[12];
		dest[13] = mat[13];
		dest[14] = mat[14];
		dest[15] = mat[15];
	}
	
	// Perform axis-specific matrix multiplication
	dest[0] = a00*c + a10*s;
	dest[1] = a01*c + a11*s;
	dest[2] = a02*c + a12*s;
	dest[3] = a03*c + a13*s;
	
	dest[4] = a00*-s + a10*c;
	dest[5] = a01*-s + a11*c;
	dest[6] = a02*-s + a12*c;
	dest[7] = a03*-s + a13*c;
	
	return dest;
};

/*
 * mat4.frustum
 * Generates a frustum matrix with the given bounds
 *
 * Params:
 * left, right - scalar, left and right bounds of the frustum
 * bottom, top - scalar, bottom and top bounds of the frustum
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.frustum = function(left, right, bottom, top, near, far, dest) {
	if(!dest) { dest = mat4.create(); }
	var rl = (right - left);
	var tb = (top - bottom);
	var fn = (far - near);
	dest[0] = (near*2) / rl;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = (near*2) / tb;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = (right + left) / rl;
	dest[9] = (top + bottom) / tb;
	dest[10] = -(far + near) / fn;
	dest[11] = -1;
	dest[12] = 0;
	dest[13] = 0;
	dest[14] = -(far*near*2) / fn;
	dest[15] = 0;
	return dest;
};

/*
 * mat4.perspective
 * Generates a perspective projection matrix with the given bounds
 *
 * Params:
 * fovy - scalar, vertical field of view
 * aspect - scalar, aspect ratio. typically viewport width/height
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.perspective = function(fovy, aspect, near, far, dest) {
	var top = near*Math.tan(fovy*Math.PI / 360.0);
	var right = top*aspect;
	return mat4.frustum(-right, right, -top, top, near, far, dest);
};

/*
 * mat4.ortho
 * Generates a orthogonal projection matrix with the given bounds
 *
 * Params:
 * left, right - scalar, left and right bounds of the frustum
 * bottom, top - scalar, bottom and top bounds of the frustum
 * near, far - scalar, near and far bounds of the frustum
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.ortho = function(left, right, bottom, top, near, far, dest) {
	if(!dest) { dest = mat4.create(); }
	var rl = (right - left);
	var tb = (top - bottom);
	var fn = (far - near);
	dest[0] = 2 / rl;
	dest[1] = 0;
	dest[2] = 0;
	dest[3] = 0;
	dest[4] = 0;
	dest[5] = 2 / tb;
	dest[6] = 0;
	dest[7] = 0;
	dest[8] = 0;
	dest[9] = 0;
	dest[10] = -2 / fn;
	dest[11] = 0;
	dest[12] = -(left + right) / rl;
	dest[13] = -(top + bottom) / tb;
	dest[14] = -(far + near) / fn;
	dest[15] = 1;
	return dest;
};

/*
 * mat4.ortho
 * Generates a look-at matrix with the given eye position, focal point, and up axis
 *
 * Params:
 * eye - vec3, position of the viewer
 * center - vec3, point the viewer is looking at
 * up - vec3 pointing "up"
 * dest - Optional, mat4 frustum matrix will be written into
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
mat4.lookAt = function(eye, center, up, dest) {
	if(!dest) { dest = mat4.create(); }
	
	var eyex = eye[0],
		eyey = eye[1],
		eyez = eye[2],
		upx = up[0],
		upy = up[1],
		upz = up[2],
		centerx = center[0],
		centery = center[1],
		centerz = center[2];

	if (eyex == centerx && eyey == centery && eyez == centerz) {
		return mat4.identity(dest);
	}
	
	var z0,z1,z2,x0,x1,x2,y0,y1,y2,len;
	
	//vec3.direction(eye, center, z);
	z0 = eyex - center[0];
	z1 = eyey - center[1];
	z2 = eyez - center[2];
	
	// normalize (no check needed for 0 because of early return)
	len = 1/Math.sqrt(z0*z0 + z1*z1 + z2*z2);
	z0 *= len;
	z1 *= len;
	z2 *= len;
	
	//vec3.normalize(vec3.cross(up, z, x));
	x0 = upy*z2 - upz*z1;
	x1 = upz*z0 - upx*z2;
	x2 = upx*z1 - upy*z0;
	len = Math.sqrt(x0*x0 + x1*x1 + x2*x2);
	if (!len) {
		x0 = 0;
		x1 = 0;
		x2 = 0;
	} else {
		len = 1/len;
		x0 *= len;
		x1 *= len;
		x2 *= len;
	};
	
	//vec3.normalize(vec3.cross(z, x, y));
	y0 = z1*x2 - z2*x1;
	y1 = z2*x0 - z0*x2;
	y2 = z0*x1 - z1*x0;
	
	len = Math.sqrt(y0*y0 + y1*y1 + y2*y2);
	if (!len) {
		y0 = 0;
		y1 = 0;
		y2 = 0;
	} else {
		len = 1/len;
		y0 *= len;
		y1 *= len;
		y2 *= len;
	}
	
	dest[0] = x0;
	dest[1] = y0;
	dest[2] = z0;
	dest[3] = 0;
	dest[4] = x1;
	dest[5] = y1;
	dest[6] = z1;
	dest[7] = 0;
	dest[8] = x2;
	dest[9] = y2;
	dest[10] = z2;
	dest[11] = 0;
	dest[12] = -(x0*eyex + x1*eyey + x2*eyez);
	dest[13] = -(y0*eyex + y1*eyey + y2*eyez);
	dest[14] = -(z0*eyex + z1*eyey + z2*eyez);
	dest[15] = 1;
	
	return dest;
};

/*
 * mat4.str
 * Returns a string representation of a mat4
 *
 * Params:
 * mat - mat4 to represent as a string
 *
 * Returns:
 * string representation of mat
 */
mat4.str = function(mat) {
	return '[' + mat[0] + ', ' + mat[1] + ', ' + mat[2] + ', ' + mat[3] + 
		', '+ mat[4] + ', ' + mat[5] + ', ' + mat[6] + ', ' + mat[7] + 
		', '+ mat[8] + ', ' + mat[9] + ', ' + mat[10] + ', ' + mat[11] + 
		', '+ mat[12] + ', ' + mat[13] + ', ' + mat[14] + ', ' + mat[15] + ']';
};

/*
 * quat4 - Quaternions 
 */
quat4 = {};

/*
 * quat4.create
 * Creates a new instance of a quat4 using the default array type
 * Any javascript array containing at least 4 numeric elements can serve as a quat4
 *
 * Params:
 * quat - Optional, quat4 containing values to initialize with
 *
 * Returns:
 * New quat4
 */
quat4.create = function(quat) {
	var dest = new glMatrixArrayType(4);
	
	if(quat) {
		dest[0] = quat[0];
		dest[1] = quat[1];
		dest[2] = quat[2];
		dest[3] = quat[3];
	}
	
	return dest;
};

/*
 * quat4.set
 * Copies the values of one quat4 to another
 *
 * Params:
 * quat - quat4 containing values to copy
 * dest - quat4 receiving copied values
 *
 * Returns:
 * dest
 */
quat4.set = function(quat, dest) {
	dest[0] = quat[0];
	dest[1] = quat[1];
	dest[2] = quat[2];
	dest[3] = quat[3];
	
	return dest;
};

/*
 * quat4.calculateW
 * Calculates the W component of a quat4 from the X, Y, and Z components.
 * Assumes that quaternion is 1 unit in length. 
 * Any existing W component will be ignored. 
 *
 * Params:
 * quat - quat4 to calculate W component of
 * dest - Optional, quat4 receiving calculated values. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.calculateW = function(quat, dest) {
	var x = quat[0], y = quat[1], z = quat[2];

	if(!dest || quat == dest) {
		quat[3] = -Math.sqrt(Math.abs(1.0 - x*x - y*y - z*z));
		return quat;
	}
	dest[0] = x;
	dest[1] = y;
	dest[2] = z;
	dest[3] = -Math.sqrt(Math.abs(1.0 - x*x - y*y - z*z));
	return dest;
}

/*
 * quat4.inverse
 * Calculates the inverse of a quat4
 *
 * Params:
 * quat - quat4 to calculate inverse of
 * dest - Optional, quat4 receiving inverse values. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.inverse = function(quat, dest) {
	if(!dest || quat == dest) {
		quat[0] *= -1;
		quat[1] *= -1;
		quat[2] *= -1;
		return quat;
	}
	dest[0] = -quat[0];
	dest[1] = -quat[1];
	dest[2] = -quat[2];
	dest[3] = quat[3];
	return dest;
}

/*
 * quat4.length
 * Calculates the length of a quat4
 *
 * Params:
 * quat - quat4 to calculate length of
 *
 * Returns:
 * Length of quat
 */
quat4.length = function(quat) {
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
	return Math.sqrt(x*x + y*y + z*z + w*w);
}

/*
 * quat4.normalize
 * Generates a unit quaternion of the same direction as the provided quat4
 * If quaternion length is 0, returns [0, 0, 0, 0]
 *
 * Params:
 * quat - quat4 to normalize
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.normalize = function(quat, dest) {
	if(!dest) { dest = quat; }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];
	var len = Math.sqrt(x*x + y*y + z*z + w*w);
	if(len == 0) {
		dest[0] = 0;
		dest[1] = 0;
		dest[2] = 0;
		dest[3] = 0;
		return dest;
	}
	len = 1/len;
	dest[0] = x * len;
	dest[1] = y * len;
	dest[2] = z * len;
	dest[3] = w * len;
	
	return dest;
}

/*
 * quat4.multiply
 * Performs a quaternion multiplication
 *
 * Params:
 * quat - quat4, first operand
 * quat2 - quat4, second operand
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.multiply = function(quat, quat2, dest) {
	if(!dest) { dest = quat; }
	
	var qax = quat[0], qay = quat[1], qaz = quat[2], qaw = quat[3];
	var qbx = quat2[0], qby = quat2[1], qbz = quat2[2], qbw = quat2[3];
	
	dest[0] = qax*qbw + qaw*qbx + qay*qbz - qaz*qby;
	dest[1] = qay*qbw + qaw*qby + qaz*qbx - qax*qbz;
	dest[2] = qaz*qbw + qaw*qbz + qax*qby - qay*qbx;
	dest[3] = qaw*qbw - qax*qbx - qay*qby - qaz*qbz;
	
	return dest;
}

/*
 * quat4.multiplyVec3
 * Transforms a vec3 with the given quaternion
 *
 * Params:
 * quat - quat4 to transform the vector with
 * vec - vec3 to transform
 * dest - Optional, vec3 receiving operation result. If not specified result is written to vec
 *
 * Returns:
 * dest if specified, vec otherwise
 */
quat4.multiplyVec3 = function(quat, vec, dest) {
	if(!dest) { dest = vec; }
	
	var x = vec[0], y = vec[1], z = vec[2];
	var qx = quat[0], qy = quat[1], qz = quat[2], qw = quat[3];

	// calculate quat * vec
	var ix = qw*x + qy*z - qz*y;
	var iy = qw*y + qz*x - qx*z;
	var iz = qw*z + qx*y - qy*x;
	var iw = -qx*x - qy*y - qz*z;
	
	// calculate result * inverse quat
	dest[0] = ix*qw + iw*-qx + iy*-qz - iz*-qy;
	dest[1] = iy*qw + iw*-qy + iz*-qx - ix*-qz;
	dest[2] = iz*qw + iw*-qz + ix*-qy - iy*-qx;
	
	return dest;
}

/*
 * quat4.toMat3
 * Calculates a 3x3 matrix from the given quat4
 *
 * Params:
 * quat - quat4 to create matrix from
 * dest - Optional, mat3 receiving operation result
 *
 * Returns:
 * dest if specified, a new mat3 otherwise
 */
quat4.toMat3 = function(quat, dest) {
	if(!dest) { dest = mat3.create(); }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

	var x2 = x + x;
	var y2 = y + y;
	var z2 = z + z;

	var xx = x*x2;
	var xy = x*y2;
	var xz = x*z2;

	var yy = y*y2;
	var yz = y*z2;
	var zz = z*z2;

	var wx = w*x2;
	var wy = w*y2;
	var wz = w*z2;

	dest[0] = 1 - (yy + zz);
	dest[1] = xy - wz;
	dest[2] = xz + wy;

	dest[3] = xy + wz;
	dest[4] = 1 - (xx + zz);
	dest[5] = yz - wx;

	dest[6] = xz - wy;
	dest[7] = yz + wx;
	dest[8] = 1 - (xx + yy);
	
	return dest;
}

/*
 * quat4.toMat4
 * Calculates a 4x4 matrix from the given quat4
 *
 * Params:
 * quat - quat4 to create matrix from
 * dest - Optional, mat4 receiving operation result
 *
 * Returns:
 * dest if specified, a new mat4 otherwise
 */
quat4.toMat4 = function(quat, dest) {
	if(!dest) { dest = mat4.create(); }
	
	var x = quat[0], y = quat[1], z = quat[2], w = quat[3];

	var x2 = x + x;
	var y2 = y + y;
	var z2 = z + z;

	var xx = x*x2;
	var xy = x*y2;
	var xz = x*z2;

	var yy = y*y2;
	var yz = y*z2;
	var zz = z*z2;

	var wx = w*x2;
	var wy = w*y2;
	var wz = w*z2;

	dest[0] = 1 - (yy + zz);
	dest[1] = xy - wz;
	dest[2] = xz + wy;
	dest[3] = 0;

	dest[4] = xy + wz;
	dest[5] = 1 - (xx + zz);
	dest[6] = yz - wx;
	dest[7] = 0;

	dest[8] = xz - wy;
	dest[9] = yz + wx;
	dest[10] = 1 - (xx + yy);
	dest[11] = 0;

	dest[12] = 0;
	dest[13] = 0;
	dest[14] = 0;
	dest[15] = 1;
	
	return dest;
}

/*
 * quat4.slerp
 * Performs a spherical linear interpolation between two quat4
 *
 * Params:
 * quat - quat4, first quaternion
 * quat2 - quat4, second quaternion
 * slerp - interpolation amount between the two inputs
 * dest - Optional, quat4 receiving operation result. If not specified result is written to quat
 *
 * Returns:
 * dest if specified, quat otherwise
 */
quat4.slerp = function(quat, quat2, slerp, dest) {
    if(!dest) { dest = quat; }
    
	var cosHalfTheta =  quat[0]*quat2[0] + quat[1]*quat2[1] + quat[2]*quat2[2] + quat[3]*quat2[3];
	
	if (Math.abs(cosHalfTheta) >= 1.0){
	    if(dest != quat) {
		    dest[0] = quat[0];
		    dest[1] = quat[1];
		    dest[2] = quat[2];
		    dest[3] = quat[3];
		}
		return dest;
	}
	
	var halfTheta = Math.acos(cosHalfTheta);
	var sinHalfTheta = Math.sqrt(1.0 - cosHalfTheta*cosHalfTheta);

	if (Math.abs(sinHalfTheta) < 0.001){
		dest[0] = (quat[0]*0.5 + quat2[0]*0.5);
		dest[1] = (quat[1]*0.5 + quat2[1]*0.5);
		dest[2] = (quat[2]*0.5 + quat2[2]*0.5);
		dest[3] = (quat[3]*0.5 + quat2[3]*0.5);
		return dest;
	}
	
	var ratioA = Math.sin((1 - slerp)*halfTheta) / sinHalfTheta;
	var ratioB = Math.sin(slerp*halfTheta) / sinHalfTheta; 
	
	dest[0] = (quat[0]*ratioA + quat2[0]*ratioB);
	dest[1] = (quat[1]*ratioA + quat2[1]*ratioB);
	dest[2] = (quat[2]*ratioA + quat2[2]*ratioB);
	dest[3] = (quat[3]*ratioA + quat2[3]*ratioB);
	
	return dest;
}


/*
 * quat4.str
 * Returns a string representation of a quaternion
 *
 * Params:
 * quat - quat4 to represent as a string
 *
 * Returns:
 * string representation of quat
 */
quat4.str = function(quat) {
	return '[' + quat[0] + ', ' + quat[1] + ', ' + quat[2] + ', ' + quat[3] + ']'; 
}

exports.glMatrixArrayType = glMatrixArrayType;
exports.vec3 = vec3;
exports.quat4 = quat4;
exports.mat4 = mat4;
exports.mat3 = mat3;
}});
