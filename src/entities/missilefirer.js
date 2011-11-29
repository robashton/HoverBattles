var vec3 = require('../thirdparty/glmatrix').vec3;
var FiringController = require('./firingcontroller').FiringController;
var Missile = require('./missile').Missile;
var Hovercraft = require('./hovercraft').Hovercraft;


exports.MissileFirer = function(app, missileFactory) {
  var self = this;
  var registeredMissiles = {};

  var onEntityFiredMissile = function(data) {
    var source = app.scene.getEntity(data.sourceid);
    var target = app.scene.getEntity(data.targetid);
   
    if(!source) { console.warn('Erk, could not find source of missile firing'); return; };
    if(!target) { console.warn('Erk, could not find target of missile firing'); return; };

    // This is far from ideal, I guess this is where a DoD approach would have been a better fit
    // Perhaps not in terms of performance as it would make little difference, but from a management/design PoV
    var missile = missileFactory.create(data.missileid);
    app.scene.addEntity(missile);
    missile.go(data.sourceid, data.targetid);
    registerMissile(data.sourceid, data.missileid);
  }; 
  
  var registerMissile = function(sourceid, missileid) {
    if(!registeredMissiles[sourceid])
      registeredMissiles[sourceid] = new EntityMissileCollection(app.scene, sourceid);
    registeredMissiles[sourceid].add(missileid);   
  };
  
  var unregisterMissile = function(sourceid, missileid) {
     registeredMissiles[sourceid].remove(missileid);
     if(!registeredMissiles[sourceid].hasAnyMissiles())
        delete registeredMissiles[sourceid];
  };
  
  var notifyAllMissilesOfEntityConfusion = function(sourceid) {
    if(registeredMissiles[sourceid])
      registeredMissiles[sourceid].notifyStopTrackingTarget();
  }; 
 
  var onTargetHit = function(data) {
    unregisterMissile(data.sourceid, data.missileid);
    removeMissileFromScene(data.missileid);
  };

  var onMissileExpired = function(data) {
    unregisterMissile(data.sourceid, data.missileid);
    removeMissileFromScene(data.missileid);
  };

  var removeMissileFromScene = function(id) {
    app.scene.withEntity(id, function(missile) {
	    app.scene.removeEntity(missile);
    });	
  };
  
  var onEntityCancelledTrackingTarget = function() {
    notifyAllMissilesOfEntityConfusion(this.getId());
  };  
  
  app.scene.on('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  app.scene.on('fireMissile', onEntityFiredMissile);
  app.scene.on('targetHit',  onTargetHit);
  app.scene.on('missileExpired', onMissileExpired);
};


var EntityMissileCollection = function(scene, entityId) {
  var self = this;
  var count = 0;
  var missiles = {};
  
  self.add = function(missileid) {
    missiles[missileid] = {};
    count++;
  };
  
  self.remove = function(missileid) {
    delete missiles[missileid];
    count--;
  };
  
  self.notifyStopTrackingTarget = function() {  
    for(var missileid in missiles) {
      var missile = scene.getEntity(missileid);
      if(missile)
        missile.stopTrackingTarget();
    }
  };
  
  self.hasAnyMissiles = function() {
    return count > 0;
  };

};

