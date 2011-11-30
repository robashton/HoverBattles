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

    if(target) {
	    updateVelocityTowardsTarget();
	    if(determineIfTargetIsReached()) return;
	  }
	  performPhysics();
    determineIfItIsTimeToExpire();
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
	
	var translatedBoundsCentre = vec3.create([0,0,0]);
	var determineIfTargetIsReached = function() {
	  if(!target) return;
		var myBounds = bounds.translate(self.position, translatedBoundsCentre);
    
		var targetSphere = target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
      notifyTargetOfCollision();  
      notifyOutsideWorldOfCollision();
      return true;
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
	
  var current = vec3.create([0,0,0]);
  var desired = vec3.create([0,0,0]);
	var updateVelocityTowardsTarget = function() { 
	
    calculateVectorToTarget(desired);
		distanceFromTarget = vec3.length(desired);
		
    vec3.normalize(desired);
    vec3.normalize(self._velocity, current);
    
    var adjuster = getAdjusterBasedOnTime();
    
    vec3.scale(desired, adjuster);
    vec3.scale(current, 1.0 - adjuster);
    vec3.add(desired, current);
    vec3.scale(desired, maxSpeed);		
		
    self._velocity = desired;
	};
	
	var getAdjusterBasedOnTime = function() {
	  if(ticksElapsedSinceFiring < 30)
	     return 0.3;
	  if(ticksElapsedSinceFiring < 45)
	     return 0.2;
	  if(ticksElapsedSinceFiring < 60)
	     return 0.1;
	  if(ticksElapsedSinceFiring < 90)
	     return 0.05;
	  return  0.01;
	};
	
	var capSpeedIfNecessary = function() {
	  var speed = vec3.length(self._velocity);
	  var scale = maxSpeed / speed;
	  if(scale < 1.0)
	    vec3.scale(self._velocity, scale);
	};
	
	var calculateVectorToTarget = function(difference) {	
    var targetDestination = target.position;
    var currentPosition = self.position;
	  vec3.subtract(targetDestination, currentPosition, difference);
	  return difference;
	};
	
  var onMissileLost = function() {
    self.clearTarget();
  };
  
  self.updateSync = function(sync) {
    sync.position = self.position;
  };
  
  self.addEventHandler('missileLost', onMissileLost);
};

Missile.Type = "Missile";
exports.Missile = Missile;
