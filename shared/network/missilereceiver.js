var Explosion = require('../explosion').Explosion;

var MissileReceiver = function(app, communication, missileFactory) {
  this.app = app;    
	this.missileFactory = missileFactory;
	this.communication = communication;
	this.missiles = {};
};

MissileReceiver.prototype._fireMissile = function(data) {
  var source = this.app.scene.getEntity(data.sourceid);
  var target = this.app.scene.getEntity(data.targetid);
 
  if(!source) { console.warn('Erk, could not find source of missile firing'); return; };
  if(!target) { console.warn('Erk, could not find target of missile firing'); return; };

  var missile = this.missileFactory.create(data.missileid, data.sourceid, data.targetid, source.position);
  this.app.scene.addEntity(missile);
  this.attachEmitterToMissile(missile);
};

MissileReceiver.prototype._missileLockLost = function(data) {
  this.makeMissileAwol(data.missileid);
};

MissileReceiver.prototype._destroyMissile = function(data) {
  this.removeMissileFromScene(data.missileid);
}; 

MissileReceiver.prototype.makeMissileAwol = function(missileid) {
   this.app.scene.withEntity(missileid, function(missile) {
      missile.clearTarget();
   });  
};

MissileReceiver.prototype.removeMissileFromScene = function(id) {
  var self = this;
  self.app.scene.withEntity(id, function(missile) {
	  self.app.scene.removeEntity(missile);
		self.app.scene.removeEntity(missile.emitter);
    self.createExplosionForMissile(missile);
  });	
};

MissileReceiver.prototype.createExplosionForMissile = function(missile) {
  var self = this;
  var explosion = new Explosion(self.app, {
    position: missile.position,    
    initialVelocity: vec3.create([0,0,0])
  });
};

MissileReceiver.prototype.attachEmitterToMissile = function(missile) {
	var emitter = new ParticleEmitter(missile.getId() + 'trail', 4000, this.app,
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
    missile.emitter = emitter;
    this.app.scene.addEntity(emitter);
};

exports.MissileReceiver = MissileReceiver;
