CollisionManager = function(){
    
};

CollisionManager.prototype.processPair = function(entityOne, entityTwo) {
  if(entityOne._velocity == null || entityTwo._velocity == null) { return; }
  if(entityOne.position == null || entityTwo.position == null) { return; }

  // For simplicity, we'll actually do a sphere check here cos we can probably get away with that
  // rather than enter the complexity of having to deal with AABB rotation and all that
  //var objectOneBoundingSphere = entityOne.
  
  
};


exports.CollisionManager = CollisionManager;