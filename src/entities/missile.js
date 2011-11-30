Sphere = require('../core/bounding').Sphere;

var Missile = function() {
  var self = this;

	self._velocity = vec3.create([0,0,0]);	
	
	var ticksElapsedSinceFiring = 0;

  var maxSpeed = 5.0;
  var adjuster = 0.8;  
	var bounds = new Sphere(1.0, [0,0,0]);
  var isTrackingTarget = false;
	var distanceFromTarget = vec3.create([99,99,99]);
	var sourceid = null;
	var targetid = null;
	
	source = null;
	target = null;
	
	self.go = function(sid, tid) {
	  sourceid = sid;
	  targetid = tid;
	  isTrackingTarget = true;	  
	  source = self._scene.getEntity(sourceid);
	  target = self._scene.getEntity(targetid);	  
	  self.position = vec3.create(source.position);	  
	  setupInitialVelocity();
	};

  self.clearTarget = function() {
    targetid = null;
    isTrackingTarget = false;
  };

  self.doLogic = function() {
    ticksElapsedSinceFiring++;
    if(isTrackingTarget) updateTargetReferences();

    if(isTrackingTarget) {   
		  updateVelocityTowardsTarget();
		  performPhysics();
		  determineIfTargetIsReached();
    } else {
      performPhysics();
      determineIfItIsTimeToExpire();
    }
	};
	
	var performPhysics = function() {
		vec3.add(self.position, self._velocity);
    checkIfMissileHasHitTerrain();
	};

  var checkIfMissileHasHitTerrain = function() {
    var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
    if(terrainHeight > self.position[1]) {
      destroyMissileOfNaturalCauses();
	  }
  };
	
	var determineIfItIsTimeToExpire = function(){
	  if(ticksElapsedSinceFiring > 300)
	    destroyMissileOfNaturalCauses();
	};
	
	self.stopTrackingTarget = function() {
	  if(!isTrackingTarget) return;
    self.raiseServerEvent('missileLost', { 
	    targetid: targetid,
	    sourceid: sourceid,
      missileid: self.getId()
    });
	};

  var updateTargetReferences = function() {
    if(ticksElapsedSinceFiring > 200) {
      self.stopTrackingTarget();
      return;
    }    
    source = getSource();
    target = getTarget();

    if(!source || !target) {
			self.stopTrackingTarget();
    }
  };

  var getSource = function() {
    return self._scene.getEntity(sourceid);
  };

  var getTarget = function() {
    return self._scene.getEntity(targetid);
  };
	
	var determineIfTargetIsReached = function() {
		var myBounds = bounds.translate(self.position);
    
		var targetSphere = target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
      notifyTargetOfCollision();  
      notifyOutsideWorldOfCollision();
    }
	};

  var notifyOutsideWorldOfCollision = function(){ 
	  self.raiseServerEvent('targetHit', { 
			targetid: targetid,
			sourceid: sourceid,
      missileid: self.getId() 
    });
  };

  var notifyTargetOfCollision = function(){ 
	  self._scene.withEntity(targetid, function(target) {
      target.sendMessage('projectileHit', {
			  targetid: targetid,
			  sourceid: sourceid
      });
    });
  }; 
	

  
  var destroyMissileOfNaturalCauses = function() {
    self.raiseServerEvent('missileExpired', { 
      missileid: self.getId(),
      sourceid: sourceid 
    });
  };
	
	var isWithinReachOfTarget = function() {
		var difference = calculateVectorToTarget();
		difference[1] = 0;
		var distanceToTargetIgnoringHeight = vec3.length(difference);
		return distanceToTargetIgnoringHeight < 2;		
	};
	
	
	var setupInitialVelocity = function() {
	
	  // Look a second into the future
	  var positionInTheFuture = vec3.create([0,0,0]);
	  var positionGoingToMove = vec3.create([0,0,0]);
	  vec3.scale(target._velocity, 30, positionGoingToMove);
	  vec3.add(target.position, positionGoingToMove, positionInTheFuture);
	  
	  // Take aim at that location
	  var difference = vec3.create([0,0,0]);
	  vec3.subtract(positionInTheFuture, source.position, difference);
	  vec3.normalize(difference);
	  
	  // And fire at max speed
	  vec3.scale(difference, maxSpeed);	  
	  self._velocity = difference;    
	};
	
	var updateVelocityTowardsTarget = function() {
		var difference = calculateVectorToTarget();
		distanceFromTarget = vec3.length(difference);
    vec3.normalize(difference);
		vec3.scale(difference, getAdjusterBasedOnTime());	
    vec3.add(self._velocity, difference);
    capSpeedIfNecessary();
	};
	
	var getAdjusterBasedOnTime = function() {
	  if(ticksElapsedSinceFiring < 15)
	     return adjuster * 2.0;
	  if(ticksElapsedSinceFiring < 30)
	     return adjuster;
	  if(ticksElapsedSinceFiring < 45)
	     return adjuster * 0.75;
	  if(ticksElapsedSinceFiring < 60)
	     return adjuster * 0.30;
	  return adjuster * 0.1;
	};
	
	var capSpeedIfNecessary = function() {
	  var speed = vec3.length(self._velocity);
	  var scale = maxSpeed / speed;
	  if(scale < 1.0)
	    vec3.scale(self._velocity, scale);
	};
	
	var calculateVectorToTarget = function() {	
    var targetDestination = target.position;
    var currentPosition = self.position;
	  var difference = vec3.create([0,0,0]);
	  vec3.subtract(targetDestination, currentPosition, difference);
	  return difference;
	};
	
  var onMissileLost = function() {
    self.clearTarget();
  };
  
  self.addEventHandler('missileLost', onMissileLost);
};

exports.Missile = Missile;
