var vec3 = require('./glmatrix').vec3;

CollisionManager = function(){
    
};

CollisionManager.prototype.processPair = function(entityOne, entityTwo) {
  if(entityOne._velocity == null || entityTwo._velocity == null) { return; }
  if(entityOne.position == null || entityTwo.position == null) { return; }
  if(!entityOne.getSphere || !entityTwo.getSphere) return;

  var sphereOne = entityOne.getSphere();
  var sphereTwo = entityTwo.getSphere();
  
  var results = sphereOne.intersectSphere(sphereTwo);
  
  if(results.distance > 0) return;

  var distanceToMoveEntityOne = vec3.create([0,0,0]);
  var distanceToMoveEntityTwo = vec3.create([0,0,0]);
  
  vec3.scale(results.direction, (results.distance / 2.0), distanceToMoveEntityOne);
  vec3.scale(results.direction, -(results.distance / 2.0), distanceToMoveEntityTwo);
    
  vec3.add(entityOne.position, distanceToMoveEntityOne);
  vec3.add(entityTwo.position, distanceToMoveEntityTwo);

};


exports.CollisionManager = CollisionManager;