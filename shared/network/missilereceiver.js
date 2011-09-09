var MissileReceiver = function(app, communication, missileFactory) {
    this.app = app;    
	this.missileFactory = missileFactory;
	this.communication = communication;
	this.missiles = {};
};

MissileReceiver.prototype._fireMissile = function(data) {
  var source = this.app.scene.getEntity(data.sourceid);
  var target = this.app.scene.getEntity(data.targetid);
  var missile = this.missileFactory.create(source, target);
  this.app.scene.addEntity(missile);
  this.missiles[data.sourceid] = missile;

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
};

MissileReceiver.prototype.onTargetHit = function(data) {
	this.communication.sendMessage('destroyTarget', data);
};

MissileReceiver.prototype._destroyTarget = function(data) {
	var missile = this.missiles[data.sourceid];
	this.app.scene.removeEntity(missile);
	
	if(this.app.isClient)
		this.app.scene.removeEntity(missile.emitter);
	delete this.missiles[data.sourceid];
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

MissileReceiver.prototype._destroyMissile = function(data) {
    
    // Remove the bullet from the scene    
};

exports.MissileReceiver = MissileReceiver;