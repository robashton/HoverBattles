var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var Frustum = require('./frustum').Frustum;
var MissileFactory = require('./missilefactory').MissileFactory;

var Tracking = {
	
	_ctor: function() {
		this.targetsInSight = {};
	},
	doLogic: function() {
		
	   for(var i in this._scene._entities){
            var entity = this._scene._entities[i];
            if(entity === this) continue;
            if(!entity.getOldestTrackedObject) continue;

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
        this.targetsInSight[id] = {
			entity: entity,
			time: new Date()
		};
		this.raiseEvent('targetGained', { target: entity});
    },
	
    notifyNotAimingAt: function(entity)  {
        var id = entity.getId();
        if(!this.targetsInSight[id]) return;			
		delete this.targetsInSight[id];
		this.raiseEvent('targetLost', { target: entity});
    },
	
	getOldestTrackedObject: function() {
		var oldest = null;
		for(var id in this.targetsInSight){
			var current = this.targetsInSight[id];
			if(oldest == null) { 
				oldest = current;
				continue;
			}		
		}
		if(oldest === null) return null;
		return oldest['entity'];
	}
};

var Targeting = {

	_ctor: function(){ 
		this._currentTarget = null;
		this.addEventHandler('targetLost', this.onTargetLost);
	},
	
	doLogic: function() {		
		this.evaluateWhetherNewTargetIsRequired();
	},
	
	onTargetLost: function(data) {
		if(this._currentTarget === data.target)
			this.deassignTarget();
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
		console.info('Deassigned a target');
		this.raiseEvent('cancelledTrackingTarget', {
			target: target
		});
	},
	
	assignNewTarget: function(target) {
		this._currentTarget = target;
		console.info('Assigned a target');
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
	},
};

var FiringController = function(entity, communication) {
	this.entity = entity;
	var parent = this;
	this.communication = communication;
	entity.addEventHandler('trackingTarget', function(data) { parent.onTrackingTarget(data); });
	entity.addEventHandler('cancelledTrackingTarget', function(data) { parent.onCancelledTrackingTarget(data); });
	entity.addEventHandler('tick', function(data) { parent.onTick(data); });
	this._trackingStartTime = null;
	this._trackedTarget = null;
	this.fired = false;
};
	
FiringController.prototype.onTrackingTarget = function(ev) {
	this._trackingStartTime = new Date();
	this._trackedTarget = ev.target;
	this.fired = false;
};
	
FiringController.prototype.onCancelledTrackingTarget = function(ev) {
	this._trackingStartTime = null;
	this._trackedTarget = null;
};
	
FiringController.prototype.onTick = function() {
	if(!this._trackedTarget || this.fired) return;
	var currentTime = new Date();
	var timeElapsedSinceStartedTracking = currentTime - this._trackingStartTime;
	if(timeElapsedSinceStartedTracking > 3000) {
		this.fired = true;
		this.communication.sendMessage('fireMissile', { id: this.entity.getId(), targetid: this._trackedTarget.getId()});
	}
}

exports.FiringController = FiringController;
exports.Tracking = Tracking;
exports.Targeting = Targeting;