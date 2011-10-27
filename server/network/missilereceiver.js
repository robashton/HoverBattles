var MissileReceiver = function(app, communication, missileFactory) {
  this.app = app;    
	this.missileFactory = missileFactory;
	this.communication = communication;
	this.missiles = {};
};

MissileReceiver.prototype.makeMissileAwol = function(missileid) {
  var self = this;
  this.app.scene.withEntity(missileid, function(missile) {
     missile.clearTarget();
  });
};

MissileReceiver.prototype.removeMissileFromScene = function(id) {
  var self = this;
  self.app.scene.withEntity(id, function(missile) {
	  self.app.scene.removeEntity(missile);
  });	
};

// This is the server responding to events from the missile
MissileReceiver.prototype.attachHandlersToCoordinateMissile = function(missile) {
	var self = this;
	missile.addEventHandler('targetHit', function(data) { self.onTargetHit(data); });
  missile.addEventHandler('missileLost', function(data) { self.onMissileLost(data); });
  missile.addEventHandler('missileExpired', function(data) { self.onMissileExpired(data); });
};

// These are about notifying the client AND the server that something has happened
MissileReceiver.prototype.onTargetHit = function(data) {
	this.communication.sendMessage('destroyTarget', data);
  this.communication.sendMessage('destroyMissile', data);
};
MissileReceiver.prototype.onMissileLost = function(data) {
	this.communication.sendMessage('missileLockLost', data);
};
MissileReceiver.prototype.onMissileExpired = function(data) {
  this.communication.sendMessage('destroyMissile', data);
};

// These are the messages that both client AND server will get and therefore respond to
MissileReceiver.prototype._fireMissile = function(data) {
  var source = this.app.scene.getEntity(data.sourceid);
  var target = this.app.scene.getEntity(data.targetid);
 
  if(!source) return;
  if(!target) return;

  var missile = this.missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
  this.app.scene.addEntity(missile);
	this.attachHandlersToCoordinateMissile(missile);
};

MissileReceiver.prototype._missileLockLost = function(data) {
  this.makeMissileAwol(data.missileid);
};

MissileReceiver.prototype._destroyMissile = function(data) {
  this.removeMissileFromScene(data.missileid);
}; 

exports.MissileReceiver = MissileReceiver;
