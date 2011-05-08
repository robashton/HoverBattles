Entity = require('./entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function(app) {
    this.app = app;
};

MissileFactory.prototype.create = function(target) {
  var entity = new Entity("missile-" + new Date());
  entity.attach(Missile);
  return entity;
};

exports.MissileFactory = MissileFactory;