Entity = require('./entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function(app) {
    this.app = app;
};

MissileFactory.prototype.create = function(missileid, sourceid, targetid, position) {
  var entity = new Entity(missileid);

  
  entity.attach(Missile);
  entity.setSource(sourceid, position);
  entity.setTarget(targetid);

  return entity;
};

exports.MissileFactory = MissileFactory;
