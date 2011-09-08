var MissileReceiver = function(app, missileFactory) {
    this.app = app;    
	this.missileFactory = missileFactory;
	this.missiles = {};
};

MissileReceiver.prototype._fireMissile = function(data) {
  var source = this.app.scene.getEntity(data.id);
  var target = this.app.scene.getEntity(data.targetid);
  var missile = this.missileFactory.create(source, target);
  this.app.scene.addEntity(missile);
  this.missiles[data.id] = missile;

  // Not 100% sure about this, but going to give it a go
  // May just be a better idea to modularise smarter
  if(this.app.isClient) {
  	this.attachEmitterToMissile(missile);
  }
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