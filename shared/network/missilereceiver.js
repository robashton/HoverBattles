var MissileReceiver = function(app, communication, missileFactory) {
  this.app = app;    
	this.missileFactory = missileFactory;
	this.communication = communication;
	this.missiles = {};
};

MissileReceiver.prototype._fireMissile = function(data) {
  var source = this.app.scene.getEntity(data.sourceid);
  var target = this.app.scene.getEntity(data.targetid);
 
  if(!source) return;
  if(!target) return;

  var missile = this.missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
  this.app.scene.addEntity(missile);

  // Not 100% sure about this, but going to give it a go
  // May just be a better idea to modularise smarter
  if(this.app.isClient) {
  	this.attachEmitterToMissile(missile);
  }
  else {
	this.attachHandlersToCoordinateMissile(missile);
  }
};

MissileReceiver.prototype.attachHandlersToCoordinateMissile = function(missile) {
	var self = this;
	missile.addEventHandler('targetHit', function(data) { self.onTargetHit(data); });
  missile.addEventHandler('missileLost', function(data) { self.onMissileLost(data); });
};

MissileReceiver.prototype.onTargetHit = function(data) {
	this.communication.sendMessage('destroyTarget', data);
};

MissileReceiver.prototype.onMissileLost = function(data) {
	this.communication.sendMessage('destroyMissile', data);
};

MissileReceiver.prototype._destroyMissile = function(data) {
  this.removeMissileFromScene(data.missileid);
}; 

MissileReceiver.prototype._destroyTarget = function(data) {
  this.removeMissileFromScene(data.missileid);
};

MissileReceiver.prototype.removeMissileFromScene = function(id) {
  var self = this;
  self.app.scene.withEntity(id, function(missile) {
	  self.app.scene.removeEntity(missile);
	
	  if(self.app.isClient)
		  self.app.scene.removeEntity(missile.emitter);
  });	
};

MissileReceiver.prototype.attachEmitterToMissile = function(missile) {
	var emitter = new ParticleEmitter(missile.getId() + 'trail', 400, this.app,
    {
        maxsize: 100,
        maxlifetime: 0.2,
        rate: 50,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        track: function(){
            this.position = vec3.create(missile.position);
        }
    });
    missile.emitter = emitter;
    this.app.scene.addEntity(emitter);
};

exports.MissileReceiver = MissileReceiver;
