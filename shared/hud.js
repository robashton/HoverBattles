var Hovercraft = require('./hovercraft').Hovercraft;

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
    console.log('Added ' + items.length);
  };

  self.notifyRemovalOfItem = function(item) {
    var newItems = [];
    for(var i = 0; i < items.length; i++)
      if(items[i] !== item) newItems.push(items[i]);
    items = newItems;
    console.log('Removed ' + items.length);
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
  
  self.tick();  
};

var OtherPlayer = function(app, entity) {
   var self = this;
   var hudItem = null;

   self.dispose = function() {
    if(hudItem)
      app.overlay.removeItem(hudItem);
   };   
 
  var hudItem = app.overlay.addItem('indicator-' + entity.getId(), '/data/textures/indicator.png');
  
  entity.addEventHandler('tick', function() {
      var camera = app.scene.camera;

      var worldSphere = entity.getSphere();
      var transformedSphere = camera.transformSphereToScreen(worldSphere);

      var centre = transformedSphere.centre;
      var radius = transformedSphere.radius;

      if(centre[2] < 100.0)
        hudItem.hide();
      else
        hudItem.show();
   
      var position = [centre[0] - 4.0, centre[1] - (radius * 2.0)];

      hudItem.left(position[0]);
      hudItem.top(position[1]);
      hudItem.width(8.0);
      hudItem.height(8.0);   
  }); 

};


exports.Hud = function(app) {
  var self = this;
  var app = app;
  var playerId = null;
  var warnings = null;

  var trackedEntities = {};
  var playerIndicators = {};

  self.setPlayerId = function(id) {
    playerId = id;
    warnings = new WarningsContainer(app, playerId);
  };

  var hookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
    entity.addEventHandler('missileLock', onEntityMissileLock);
    entity.addEventHandler('fireMissile', onEntityFireMissile);

    if(entity.getId() !== playerId)
      playerIndicators[entity.getId()] = new OtherPlayer(app, entity);
  };

  var unHookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.removeEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.removeEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
    clearAllKnowledgeOfEntity(entity.getId());
  };

 var createTrackedEntity = function(sourceid, targetid) {
   if(sourceid === playerId) {
      trackedEntities[sourceid] = new TargettingEntity(app, sourceid, targetid);
    } else if(targetid === playerId){ 
      trackedEntities[sourceid] = new WarningEntity(app, warnings, sourceid, targetid);
    }
  };

  var clearTrackedEntity = function(sourceid) {
    var entity = trackedEntities[sourceid];

    if(entity) {
      delete trackedEntities[sourceid];
      entity.dispose();
    }
  };

  var clearIndicators = function(sourceid) {
    if(sourceid == playerId) return;
    var indicator = playerIndicators[sourceid];
    delete playerIndicators[sourceid];
    indicator.dispose();
  };

  var clearPlayerTargetIfNecessary = function(sourceid) {
    if(trackedEntities[playerId] && trackedEntities[playerId].targetid() === sourceid)
      clearTrackedEntity(playerId);
  };

  var clearAllKnowledgeOfEntity = function(sourceid) {
    clearTrackedEntity(sourceid);
    clearIndicators(sourceid);
    clearPlayerTargetIfNecessary(sourceid);

    for(i in trackedEntities)
      if(trackedEntities[i].targetid() === sourceid) clearTrackedEntity(i);
    
  };

  var onEntityTrackingTarget = function(data) {
    createTrackedEntity(this.getId(), data.target.getId());
  };

  var onEntityCancelledTrackingTarget = function(data) {
    clearTrackedEntity(this.getId());
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

  var withTrackedEntity = function(sourceid, callback) {
    if(!trackedEntities[sourceid])
      console.log('Discarding message as it is seemingly irrelevant :S')
    callback(trackedEntities[sourceid]);
  };

  self.notifyOfMissileDestruction = function(data) {
     clearTrackedEntity(data.sourceid);
  };

  self.notifyOfLockLost = function(data) {
     clearTrackedEntity(data.sourceid);
  };

  self.notifyOfHovercraftDestruction = function(data) {
    clearTrackedEntity(data.sourceid);
  };

  self.doLogic = function() {
    if(warnings) warnings.tick();
    for(var i in trackedEntities) {
      var entity = trackedEntities[i];
      entity.tick();
    }   
  };

  app.scene.onEntityAdded(hookHovercraftEvents);
  app.scene.onEntityRemoved(unHookHovercraftEvents);
};

exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
  return hudEntity;
};



