Entity = require('./entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function(app) {
    this.app = app;
};

MissileFactory.prototype.create = function(source, target) {
  var entity = new Entity("missile-" + new Date());

  entity.attach(Missile);

  // TODO: Particle Emitter

  entity.setSource(source);
  entity.setTarget(target);

  return entity;
};

exports.MissileFactory = MissileFactory;