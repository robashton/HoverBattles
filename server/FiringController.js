var FiringController = function(entity, communication) {
	this.entity = entity;
	var parent = this;
	this.communication = communication;
	entity.addEventHandler('trackingTarget', function(data) { parent.onTrackingTarget(data); });
	entity.addEventHandler('cancelledTrackingTarget', function(data) { parent.onCancelledTrackingTarget(data); });
	entity.addEventHandler('tick', function(data) { parent.onTick(data); });
  this.missileidCounter = 0;
  this.reset();
};
	
FiringController.prototype.onTrackingTarget = function(ev) {
	this._trackingStartTime = new Date();
	this._trackedTarget = ev.target;
  this._status = "tracking";
};

FiringController.prototype.reset = function() {
  this._trackingStartTime = null;
  this._trackedTarget = null;
  this._status = "null";
  this._trackedMissileId = null;
};
	
FiringController.prototype.onCancelledTrackingTarget = function(ev) {
  if(this._status === "fired") {
    this.communication.sendMessage('missileLockLost', {
      sourceid: this.entity.getId(),
      targetid: this._trackedTarget.getId(),
      missileid: this._trackedMissileId
    });
  }
  this.reset();
};
	
FiringController.prototype.onTick = function() {
	if(!this._trackedTarget || this.fired) return;
	var currentTime = new Date();
	var timeElapsedSinceStartedTracking = currentTime - this._trackingStartTime;
	if(timeElapsedSinceStartedTracking > 3000 && this._status === "tracking") {
		this._status = "locked";
    this.communication.sendMessage('missileLock', {
      sourceid: this.entity.getId(),
      targetid: this._trackedTarget.getId()
    });
  }
};

FiringController.prototype.tryFireMissile = function() {
  if(this._status === "locked") {
    this._status = "fired";
    var missileid = 'missile-' + this.entity.getId() + this.missileidCounter++;
    this._trackedMissileId = missileid;
		this.communication.sendMessage('fireMissile', { 
        missileid: missileid, 
        sourceid: this.entity.getId(), 
        targetid: this._trackedTarget.getId()
    });    
  }
};

exports.FiringController = FiringController;
