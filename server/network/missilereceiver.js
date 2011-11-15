var MissileReceiver = function(app, communication, missileFactory) {
  var self = this;
  self.app = app;    
	self.missileFactory = missileFactory;
	self.communication = communication;
	self.missiles = {};

  self.makeMissileAwol = function(missileid) {
    self.app.scene.withEntity(missileid, function(missile) {
       missile.clearTarget();
    });
  };

  self.removeMissileFromScene = function(id) {
    self.app.scene.withEntity(id, function(missile) {
	    self.app.scene.removeEntity(missile);
	    missile.removeEventHandler('targetHit', self.onTargetHit );
      missile.removeEventHandler('missileLost', self.onMissileLost );
      missile.removeEventHandler('missileExpired', self.onMissileExpired );
    });	
  };

  // This is the server responding to events from the missile
  self.attachHandlersToCoordinateMissile = function(missile) {
	  missile.addEventHandler('targetHit', self.onTargetHit );
    missile.addEventHandler('missileLost', self.onMissileLost );
    missile.addEventHandler('missileExpired', self.onMissileExpired );
  };

  // These are about notifying the client AND the server that something has happened
  self.onTargetHit = function(data) {
	  self.communication.sendMessage('destroyTarget', data);
    self.communication.sendMessage('destroyMissile', data);
  };
  self.onMissileLost = function(data) {
	  self.communication.sendMessage('missileLockLost', data);
  };
  self.onMissileExpired = function(data) {
    self.communication.sendMessage('destroyMissile', data);
  };

  // These are the messages that both client AND server will get and therefore respond to
  self._fireMissile = function(data) {
    var source = self.app.scene.getEntity(data.sourceid);
    var target = self.app.scene.getEntity(data.targetid);
   
    if(!source) return;
    if(!target) return;

    var missile = self.missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
    self.app.scene.addEntity(missile);
	  self.attachHandlersToCoordinateMissile(missile);
  };

  self._missileLockLost = function(data) {
    self.makeMissileAwol(data.missileid);
  };

  self._destroyMissile = function(data) {
    self.removeMissileFromScene(data.missileid);
  }; 

};
exports.MissileReceiver = MissileReceiver;
