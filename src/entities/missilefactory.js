Entity = require('../core/entity').Entity;
Missile = require('./missile').Missile;
Smoother = require('./smoother').Smoother;

var MissileFactory = function(app) {
  this.app = app;
};

MissileFactory.prototype.create = function(missileid) {
  var entity = new Entity(missileid); 
  entity.attach(Missile);
  
  if(this.app.isClient) {
   // entity.attach(Smoother);
  }
  
  return entity;
};

exports.MissileFactory = MissileFactory;
