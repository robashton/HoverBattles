var vec3 = require('../thirdparty/glmatrix').vec3;


exports.CollisionManager = function() {
  var self = this;
  
  var distanceToMoveEntityOne = vec3.create([0,0,0]);
  var distanceToMoveEntityTwo = vec3.create([0,0,0]);
  var transformedSphereCentre = vec3.create([0,0,0]);
  
  var transformedEntityOneSphereCentre = vec3.create([0,0,0]);
  var transformedEntityTwoSphereCentre = vec3.create([0,0,0]);
    
  self.processPair = function(entityOne, entityTwo) {
    if(entityOne._velocity == null || entityTwo._velocity == null) { return; }
    if(entityOne.position == null || entityTwo.position == null) { return; }
    if(!entityOne.getSphere || !entityTwo.getSphere) return;

    var sphereOne = entityOne.getSphere(transformedEntityOneSphereCentre);
    var sphereTwo = entityTwo.getSphere(transformedEntityTwoSphereCentre);
    
    var results = sphereOne.intersectSphere(sphereTwo, transformedSphereCentre);
    
    if(results.distance > 0) return;
   
    vec3.scale(results.direction, (results.distance / 2.0), distanceToMoveEntityOne);
    vec3.scale(results.direction, -(results.distance / 2.0), distanceToMoveEntityTwo);
      
    vec3.add(entityOne.position, distanceToMoveEntityOne);
    vec3.add(entityTwo.position, distanceToMoveEntityTwo);
  };
};
