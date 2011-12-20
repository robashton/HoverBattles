var Hovercraft = require('../entities/hovercraft').Hovercraft;

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

    for(var i in trackedCraft)
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

exports.Hud.Type = "Hud";
exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
  return hudEntity;
};



