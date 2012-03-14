var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Frustum = require('../core/frustum').Frustum;
var MissileFactory = require('./missilefactory').MissileFactory;
var Hovercraft = require('./hovercraft').Hovercraft;

exports.Tracking = function() {
  var self = this;

	self.targetsInSight = {};

	self.doLogic = function() {		
   self.tidyUpFirst();
   self.lookForCraftInVision(0.75, 250,  self.notifyAimingAt,  self.notifyNotAimingAt);
	};
	
	var vectorToOtherEntity = vec3.create([0,0,0]);
	var vectorOfAim = [0,0,0,1];
	self.lookForCraftInVision = function(fieldOfVision, allowedDistance, canSeeCraft, cannotSeeCraft) {
	  
	  self._scene.forEachEntity(function(entity) {
	    if(entity === this) return;
      if(!entity.is(Hovercraft)) return;

      // Get a vector to the other entity
      vec3.subtract(entity.position, self.position, vectorToOtherEntity);
      var distanceToOtherEntity = vec3.length(vectorToOtherEntity);            
      vec3.scale(vectorToOtherEntity, 1 / distanceToOtherEntity);

      // Get the direction we're aiming in
      vectorOfAim[0] = 0 - Math.sin(self.rotationY);
      vectorOfAim[2] = 0 - Math.cos(self.rotationY);         
      
      var quotient = vec3.dot(vectorOfAim, vectorToOtherEntity);            
      if(quotient > fieldOfVision && distanceToOtherEntity < allowedDistance)
        return canSeeCraft(entity.getId());
      else
        return cannotSeeCraft(entity.getId());   
	  });
	};

  self.tidyUpFirst = function() {
    for(var i in self.targetsInSight) {
      var entity = self._scene.getEntity(i);
      if(!entity) {
        self.notifyNotAimingAt(self.targetsInSight[i].id);
        delete self.targetsInSight[i];
        if(this._currentTarget === i)
          this._currentTarget = null;
      }
    }
  };
	
	self.notifyAimingAt = function(entityId) {
	  self.raiseServerEvent('targetGained', { target: entityId});
  };

  self.notifyNotAimingAt = function(entityId)  {
    self.raiseServerEvent('targetLost', { target: entityId});
  };
  
  var onAimingAt = function(data) {
    if(self.targetsInSight[data.target]) return;
    self.targetsInSight[data.target] = {
	    id: data.target,
	    time: new Date()
	  };
  };
  
  var onNotAimingAt = function(data) {
    if(!self.targetsInSight[data.target]) return;			
    delete self.targetsInSight[data.target];  
  };
	
	self.getOldestTrackedObject = function() {
		var oldest = null;
		for(var id in self.targetsInSight){
			var current = self.targetsInSight[id];
			if(oldest == null) { 
				oldest = current;
				continue;
			}		
		}
		if(oldest === null) return null;
		return self._scene.getEntity(oldest.id);
	};
	
	self.addEventHandler('targetGained', onAimingAt);
	self.addEventHandler('targetLost', onNotAimingAt);

};

exports.Tracking.Type = "Tracking";

exports.Targeting = function(){
  var self = this;

	self._currentTarget = null;

	self.onTargetLost = function(data) {
	  if(!self._currentTarget) return;
		if(self._currentTarget.getId() === data.target)
			self.deassignTarget();
	};

	self.addEventHandler('targetLost', self.onTargetLost);
	
	self.doLogic = function() {		
		self.evaluateWhetherNewTargetIsRequired();
	};
		
	self.hasCurrentTarget = function() {
		return self._currentTarget !== null;
	};
	
	self.getCurrentTarget = function() {
		return self._currentTarget;
	};
	
	self.deassignTarget = function() {
		var target = self._currentTarget;
		self._currentTarget = null;
		self.raiseEvent('cancelledTrackingTarget', {
			target: target
		});
	};
	
	self.assignNewTarget = function(target) {
		self._currentTarget = target;
		self.raiseEvent('trackingTarget', {
			target: target
		});
	};
	
	self.evaluateWhetherNewTargetIsRequired = function() {
		if(!self.hasCurrentTarget()) {
			var newTarget = self.getOldestTrackedObject();
			if(newTarget != null)	
				self.assignNewTarget(newTarget);
		}	
	};
};

exports.Targeting.Type = "Targeting";
