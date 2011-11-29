Entity = require('../core/entity').Entity;
Missile = require('./missile').Missile;

var MissileFactory = function() {};

MissileFactory.prototype.create = function(missileid) {
  var entity = new Entity(missileid); 
  entity.attach(Missile);
  return entity;
};

exports.MissileFactory = MissileFactory;
