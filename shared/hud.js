var Hovercraft = require('./hovercraft').Hovercraft;

var TrackedEntity = function(scene, sourceid, targetid) {
  var self = this;
  var scene = scene;
  var sourceid = sourceid;
  var targetid = targetid;
  var firedMissileId = null;
  var isLocked = false;
  var hudItem = null;
  
  self.notifyHasFired = function(missileid) {
    firedMissileId = missileid;
  };
  
  self.notifyIsLocked = function() {
    isLocked = true;
  };

  self.getScore = function() {
    if(firedMissileId) return 10;
    if(isLocked) return 5;
    return 2;    
  };
  
  self.hudItem = function(item) {
    return hudItem = item || hudItem;
  };

  self.updateHudItemLocation = function() {
    scene.withEntity(targetid, function(entity) {
      var camera = scene.camera;

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

    });
  }
};

exports.Hud = function(app) {
  var self = this;
  var app = app;
  var playerId = null;

  var trackedEntities = {};

  self.setPlayerId = function(id) {
    playerId = id;
  };

  var hookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  };

  var unHookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    clearTrackedEntity(entity.getId());
  };

 var createTrackedEntity = function(sourceid, targetid) {
   if(sourceid === playerId || targetid === playerId) {
      trackedEntities[sourceid] = new TrackedEntity(app.scene, sourceid, targetid);
    }
  };    

  var clearTrackedEntity = function(sourceid) {
    var entity = trackedEntities[sourceid];
    if(entity) {
      delete trackedEntities[sourceid];
      if(entity.hudItem())
        app.overlay.removeItem(entity.hudItem());
    }
  };

  var onEntityTrackingTarget = function(data) {
    createTrackedEntity(this.getId(), data.target.getId());
  };

  var onEntityCancelledTrackingTarget = function(data) {
    clearTrackedEntity(this.getId());
  };

  var withTrackedEntity = function(sourceid, callback) {
    if(trackedEntities[sourceid])
      callback(trackedEntities[sourceid]);
    else {
      console.log('Something went a tad wrong as we\'re not able to find a previously tracked entity');
      console.trace();
    }
  };

  self.notifyOfMissileFiring = function(data) {
    withTrackedEntity(data.sourceid, function(trackedEntity) {
      trackedEntity.notifyHasFired(data.missidleid);
    });
  };

  self.notifyOfMissileLock = function(data) {
    withTrackedEntity(data.sourceid, function(trackedEntity) {
      trackedEntity.notifyIsLocked();
    });
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

  var skipLogicCount = 0;
  self.doLogic = function() {
    if(skipLogicCount++ % 5 !== 0) return;
    
    var targettedPerson =  trackedEntities[playerId];
    if(!targettedPerson) return;

    var targeter = targettedPerson.hudItem();
    if(!targeter) {
      targeter = app.overlay.addItem('track-' + playerId, '/data/textures/testtransparent.png');
      targettedPerson.hudItem(targeter);
    }      
    targettedPerson.updateHudItemLocation(); 
    
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



