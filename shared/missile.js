Sphere = require('./bounding').Sphere;

var Missile = function() {
  var self = this;
 	self.target = null;
	self.source = null;
	self._velocity = vec3.create([0,0,0]);	
	self.bounds = new Sphere(1.0, [0,0,0]);
  self.isTrackingTarget = false;
	
	self.setSource = function(sourceid, position) {
		self.sourceid = sourceid;
		self.position = vec3.create(position);	
	};
  self.setTarget = function(targetid) {
    self.targetid = targetid;
    self.isTrackingTarget = true;
  };

  self.clearTarget = function() {
    self.targetid = null;
    self.isTrackingTarget = false;
  };

  self.doLogic = function() {
   if(self.isTrackingTarget) self.updateTargetReferences();

    if(self.isTrackingTarget) {   
		  self.updateVelocityTowardsTarget();
		  self.performPhysics();
		  self.determineIfTargetIsReached();
    } else {
      self.performPhysics();
    }		
	};

  self.updateTargetReferences = function() {
    self.source = self.getSource();
    self.target = self.getTarget();

    if(!self.source || !self.target) {
      self.isTrackingTarget = false;
			self.raiseEvent('missileLost', { 
				targetid: self.targetid,
				sourceid: self.sourceid,
        missileid: self.getId()
      });
    }
  };

  self.getSource = function() {
    return self._scene.getEntity(self.sourceid);
  };

  self.getTarget = function() {
    return self._scene.getEntity(self.targetid);
  };
	
	self.determineIfTargetIsReached = function() {
		var myBounds = self.bounds.translate(self.position);
    
		var targetSphere = self.target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
			self.raiseEvent('targetHit', { 
				targetid: self.targetid,
				sourceid: self.sourceid,
        missileid: self.getId() 
      });		  
    }
	};
	
	self.performPhysics = function() {
		vec3.add(self.position, self._velocity);

    if(self.isTrackingTarget) {
		  if(!self.isWithinReachOfTarget()) {
			  self.clipMissileToTerrain();
      }
    }
    else {
		    self.checkIfMissileHasHitTerrain();
    }

	};

  self.checkIfMissileHasHitTerrain = function() {
    var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
    if(terrainHeight > self.position[1]) {
		  self.raiseEvent('missileExpired', { 
        missileid: self.getId() 
      });
	  }
  };
	
	self.isWithinReachOfTarget = function() {
		var difference = self.calculateVectorToTarget();
		difference[1] = 0;
		var distanceToTargetIgnoringHeight = vec3.length(difference);
		return distanceToTargetIgnoringHeight < 2;		
	};
	
	self.updateVelocityTowardsTarget = function() {
		var difference = self.calculateVectorToTarget();
		self.distanceFromTarget = vec3.length(difference);

    vec3.normalize(difference);
    var speed = 0.8;  
		vec3.scale(difference, speed);	
    vec3.add(this._velocity, difference);
    vec3.scale(this._velocity, 0.8);
	};
	
	self.clipMissileToTerrain = function(vectorToTarget) {
		var terrain = self._scene.getEntity("terrain");
    var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
		self.position[1] =  Math.max(terrainHeight, self.position[1]);	
	};
	
	self.calculateVectorToTarget = function() {	
    var targetDestination = self.target.position;
    var currentPosition = self.position;
	  var difference = vec3.create([0,0,0]);
	  vec3.subtract(targetDestination, currentPosition, difference);
	  return difference;
	};

};

exports.Missile = Missile;
