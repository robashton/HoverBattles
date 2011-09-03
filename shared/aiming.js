var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var Frustum = require('./frustum').Frustum;
var MissileFactory = require('./missilefactory').MissileFactory;


var Tracking = {
	doLogic: function() {
		
		// Determine if we've started aiming at something
		
		// Raise an event for all new aimings
		
		// Raise an event for any lost aimings
		
	},
	
	getOldestTrackedObject: function() {
		
	}
};

var Targeting = {

	_ctor: function(){ 
		this._currentTarget = null;
		this.addHandler('targetGained', this.onTargetGained);
		this.addHandler('targetLost', this.onTargetLost);
	},

	onTargetGained: function(target) {
		this.evaluateWhetherNewTargetIsRequired();
	},
	
	onTargetLost: function(target) {
		if(this._currentTarget === target)
			this.deassignTarget();
				
		this.evaluateWhetherNewTargetIsRequired();
	},
	
	hasCurrentTarget: function() {
		return this._currentTarget !== null;
	},
	
	getCurrentTarget: function() {
		return this._currentTarget;
	},
	
	deassignTarget: function() {
		var target = this._currentTarget;
		this._currentTarget = null;
		this.raiseEvent('cancelledTrackingTarget', {
			target: target
		});
	},
	
	assignNewTarget: function(target) {
		this._currentTarget = target;
		this.raiseEvent('trackingTarget', {
			target: target
		});
	},	
	
	evaluateWhetherNewTargetIsRequired: function() {
		if(!this.hasCurrentTarget()) {
			var newTarget = this.getOldestTrackedObject();
			if(newTarget != null)	
				this.assignNewTarget(newTarget);
		}	
	}
	
};


var TimedFiring = {
	_ctor: function() {
		this.addHandler('trackingTarget', this.onTrackingTarget);
		this.addHandler('cancelledTrackingTarget', this.onCancelTrackingTarget);
		this._trackingStartTime = null;
		this._trackedTarget = null;
	},
	
	onTrackingTarget: function(ev) {
		this._trackingStartTime = new Date();
		this._trackedTarget = ev.target;
	},
	
	onCancelledTrackingTarget: function(ev) {
		this._trackingStartTime = null;
		this._trackedTarget = null;
	},
	
	doLogic: function() {
		if(!this._trackedTarget) return;
		var currentTime = new Date();
		var timeElapsedSinceStartedTracking = currentTime - this._trackingStartTime;
		if(timeElapsedSinceStartedTracking > 3000) {
			this.sendCommand('fireMissile', { target: this._trackedTarget});
		}
	}
};


var Aiming = {
	_ctor: function() {
	    this.currentTarget = null;
	    this.targetsInSight = {};
	    this.aimingIndicator = null;
	    this.beingTracked = false;
	    this.missile = null;	
	},
    
    canFire: function() {
      return this.currentTarget && 
      this.currentTarget.state === TargetStates.LOCKED;  
    },
    
    doLogic: function() {        
        this.determineTarget();
        this.controlFiring();
    },
    
    controlFiring: function() {
        if(!this.currentTarget || this.missile) return;
        var timeSinceLocking = new Date() - this.currentTarget.trackingStart;        
        if(timeSinceLocking < 5000) return;        
        this.currentTarget.state = TargetStates.LOCKED;
    },
    
    notifyMissileFired: function(missile) {
      this.missile = missile;
    },    
    determineTarget: function() {             
        for(var i in this._scene._entities){
            var entity = this._scene._entities[i];
            if(entity === this) continue;
            if(!entity.determineTarget) continue;
                        
            // Get a vector to the other entity
            var vectorToOtherEntity = vec3.create([0,0,0]);
            vec3.subtract(entity.position, this.position, vectorToOtherEntity);
            var distanceToOtherEntity = vec3.length(vectorToOtherEntity);            
            vec3.scale(vectorToOtherEntity, 1 / distanceToOtherEntity);
            
            // Get the direction we're aiming in
            var vectorOfAim = [0,0,-1,1];
            var lookAtTransform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
            mat4.identity(lookAtTransform);
            mat4.rotateY(lookAtTransform, this.rotationY);
            mat4.multiplyVec4(lookAtTransform, vectorOfAim);
            
            // We must both be within a certain angle of the other entity
            // and within a certain distance
            var quotient = vec3.dot(vectorOfAim, vectorToOtherEntity);            
            if(quotient > 0.75 && distanceToOtherEntity < 128) 
            {
                this.notifyAimingAt(entity);
            }
            else  
            {
                this.notifyNotAimingAt(entity);
            }
        } 
    },
    notifyAimingAt: function(entity) {
        var id = entity.getId();
        if(this.targetsInSight[id]) return;
        this.targetsInSight[id] = entity;
        
        if(this.currentTarget === null) this.assignNewTarget(entity);        
    },
    notifyNotAimingAt: function(entity)  {
        var id = entity.getId();
        if(this.targetsInSight[id]) delete this.targetsInSight[id];
        
        // Find a new target if necessary
        if(this.currentTarget && entity === this.currentTarget.entity){
            this.clearTarget();
        }
    },    
    
    clearTarget: function() {
        this.currentTarget = null;
        this.findNewTarget();
        
        if(this.missile) {
            this.missile.notifyLockLost();
            this.missile = null;
        }
        
        if(this.isPlayer) {
          entity.notifyNotBeingTracked();  
        }
    },
    
    findNewTarget: function() {
        for(i in this.targetsInSight) {
            this.assignNewTarget(this.targetsInSight[i]);
            break;
        }        
    },    
    assignNewTarget: function(entity) {
        this.currentTarget = {
            entity: entity,
            state: TargetStates.LOCKING,
            trackingStart: new Date()
        };
        
        if(this.isPlayer) {
          entity.notifyBeingLocked();  
        }
    },    
    notifyBeingTracked: function() {
       this.beingTracked = true;
        
    },
    notifyNotBeingTracked: function() {
        this.beingTracked = false;   
    }
};

var TargetStates = {
  LOCKING: 0,
  LOCKED: 1
};

exports.TimedFiring = TimedFiring;
exports.Aiming = Aiming;
exports.Tracking = Tracking;
exports.Targeting = Targeting;
exports.TargetStates = TargetStates;