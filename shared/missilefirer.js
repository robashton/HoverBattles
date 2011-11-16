var vec3 = require('./glmatrix').vec3;

exports.MissileFirer = function(app, missileFactory) {
  var self = this;

  app.scene.onEntityAdded(function(entity) {
    entity.addEventHandler('fireMissile', onEntityFiredMissile);
  });

  app.scene.onEntityRemoved(function(entity) {
    entity.removeEventHandler('fireMissile', onEntityFiredMissile);
  });

  var onEntityFiredMissile = function(data) {
    var source = app.scene.getEntity(data.sourceid);
    var target = app.scene.getEntity(data.targetid);
   
    if(!source) { console.warn('Erk, could not find source of missile firing'); return; };
    if(!target) { console.warn('Erk, could not find target of missile firing'); return; };

    var missile = missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
    app.scene.addEntity(missile);
	  self.attachHandlersToCoordinateMissile(missile);
  };

  self.attachHandlersToCoordinateMissile = function(missile) {
	  missile.addEventHandler('targetHit', onTargetHit );
    missile.addEventHandler('missileLost', onMissileLost );
    missile.addEventHandler('missileExpired', onMissileExpired );
  };

  var onTargetHit = function(data) {
	  self.communication.sendMessage('destroyTarget', data);
    self.communication.sendMessage('destroyMissile', data);
  };

  var onMissileLost = function(data) {
	  self.communication.sendMessage('missileLockLost', data);
  };

  var onMissileExpired = function(data) {
    self.communication.sendMessage('destroyMissile', data);
  };

  self.makeMissileAwol = function(missileid) {
    app.scene.withEntity(missileid, function(missile) {
       missile.clearTarget();
    });
  };

  self.removeMissileFromScene = function(id) {
    app.scene.withEntity(id, function(missile) {
	    app.scene.removeEntity(missile);
	    missile.removeEventHandler('targetHit', self.onTargetHit );
      missile.removeEventHandler('missileLost', self.onMissileLost );
      missile.removeEventHandler('missileExpired', self.onMissileExpired );
    });	
  };

  self._missileLockLost = function(data) {
    self.makeMissileAwol(data.missileid);
  };

  self._destroyMissile = function(data) {
    self.removeMissileFromScene(data.missileid);
  }; 

  self.removeMissileFromScene = function(id) {
    var self = this;
    app.scene.withEntity(id, function(missile) {
	    app.scene.removeEntity(missile);
		  app.scene.removeEntity(missile.emitter);
      self.createExplosionForMissile(missile);
    });	
  };

  self.createExplosionForMissile = function(missile) {
    var self = this;
    var explosion = new Explosion(self.app, {
      position: missile.position,    
      initialVelocity: vec3.create([0,0,0])
    });
  };
      
};
