Sphere = require('../core/bounding').Sphere;

var Missile = function() {
  var self = this;

	self._velocity = vec3.create([0,0,0]);	
	
	var ticksElapsedSinceStoppedTrackingTarget = 0;

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
	};

  self.clearTarget = function() {
    targetid = null;
    isTrackingTarget = false;
  };

  self.doLogic = function() {
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
	
	var determineIfItIsTimeToExpire = function(){
	  ticksElapsedSinceStoppedTrackingTarget++;
	  if(ticksElapsedSinceStoppedTrackingTarget > 600)
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
	
	var updateVelocityTowardsTarget = function() {
		var difference = calculateVectorToTarget();
		distanceFromTarget = vec3.length(difference);

    vec3.normalize(difference);
    var speed = 0.8;  
		vec3.scale(difference, speed);	
    vec3.add(self._velocity, difference);
    vec3.scale(self._velocity, 0.8);
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
