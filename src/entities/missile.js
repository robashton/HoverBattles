Sphere = require('../core/bounding').Sphere;

var Missile = function() {
  var self = this;

 	self.target = null;
	self.source = null;
	self._velocity = vec3.create([0,0,0]);	

	var bounds = new Sphere(1.0, [0,0,0]);
  var isTrackingTarget = false;
	var distanceFromTarget = vec3.create([99,99,99]);

	self.setSource = function(sourceid, position) {
		self.sourceid = sourceid;
		self.position = vec3.create(position);	
	};
  self.setTarget = function(targetid) {
    self.targetid = targetid;
    isTrackingTarget = true;
  };
  self.clearTarget = function() {
    self.targetid = null;
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
    }		
	};

  var updateTargetReferences = function() {
    self.source = getSource();
    self.target = getTarget();

    if(!self.source || !self.target) {
      isTrackingTarget = false;
			self.raiseServerEvent('missileLost', { 
				targetid: self.targetid,
				sourceid: self.sourceid,
        missileid: self.getId()
      });
    }
  };

  var getSource = function() {
    return self._scene.getEntity(self.sourceid);
  };

  var getTarget = function() {
    return self._scene.getEntity(self.targetid);
  };
	
	var determineIfTargetIsReached = function() {
		var myBounds = bounds.translate(self.position);
    
		var targetSphere = self.target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
      notifyTargetOfCollision();  
      notifyOutsideWorldOfCollision();
    }
	};

  var notifyOutsideWorldOfCollision = function(){ 
	  self.raiseServerEvent('targetHit', { 
			targetid: self.targetid,
			sourceid: self.sourceid,
      missileid: self.getId() 
    });		  
  };

  var notifyTargetOfCollision = function(){ 
	  self._scene.withEntity(self.targetid, function(target) {
      target.sendMessage('projectileHit', {
			  targetid: self.targetid,
			  sourceid: self.sourceid // TODO: Damage amount goes here :-)
      });
    });
  }; 
	
	var performPhysics = function() {
		vec3.add(self.position, self._velocity);

    if(isTrackingTarget) {
		  if(!isWithinReachOfTarget())
			  clipMissileToTerrain();      
    }
    else
		    checkIfMissileHasHitTerrain();
	};

  var checkIfMissileHasHitTerrain = function() {
    var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
    if(terrainHeight > self.position[1]) {
		  self.raiseServerEvent('missileExpired', { 
        missileid: self.getId() 
      });
	  }
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
	
	var clipMissileToTerrain = function(vectorToTarget) {
		var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
		self.position[1] =  Math.max(terrainHeight, self.position[1]);	
	};
	
	var calculateVectorToTarget = function() {	
    var targetDestination = self.target.position;
    var currentPosition = self.position;
	  var difference = vec3.create([0,0,0]);
	  vec3.subtract(targetDestination, currentPosition, difference);
	  return difference;
	};

  var onTargetLost = function() {
    self.clearTarget();
  };

  self.addEventHandler('targetLost', onTargetLost);
};

exports.Missile = Missile;
