Entity = require('./entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function(app) {
    this.app = app;
};

MissileFactory.prototype.create = function(source, target) {
  var entity = new Entity("missile-" + new Date());

  entity.attach(Missile);
  entity.setSource(source.getId(), source.position);
  entity.setTarget(target.getId());

  return entity;
};

exports.MissileFactory = MissileFactory;
