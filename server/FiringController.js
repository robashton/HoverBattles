var FiringController = function(entity, communication) {
	this.entity = entity;
	var parent = this;
	this.communication = communication;
	entity.addEventHandler('trackingTarget', function(data) { parent.onTrackingTarget(data); });
	entity.addEventHandler('cancelledTrackingTarget', function(data) { parent.onCancelledTrackingTarget(data); });
	entity.addEventHandler('tick', function(data) { parent.onTick(data); });
	this._trackingStartTime = null;
	this._trackedTarget = null;
	this._locked = false;
  this._fired = false;
  this.missileidCounter = 0;
};
	
FiringController.prototype.onTrackingTarget = function(ev) {
	this._trackingStartTime = new Date();
	this._trackedTarget = ev.target;
	this._locked = false;
};
	
FiringController.prototype.onCancelledTrackingTarget = function(ev) {
	this._trackingStartTime = null;
	this._trackedTarget = null;
  this._locked = false;
  this._fired = false;
};
	
FiringController.prototype.onTick = function() {
	if(!this._trackedTarget || this.fired) return;
	var currentTime = new Date();
	var timeElapsedSinceStartedTracking = currentTime - this._trackingStartTime;
	if(timeElapsedSinceStartedTracking > 3000 && !this._locked) {
		this._locked = true;
    this.communication.sendMessage('missileLock', {
      sourceid: this.entity.getId(),
      targetid: this._trackedTarget.getId()
    });
  }
};

FiringController.prototype.tryFireMissile = function() {
  if(this._locked === true && this._fired === false) {
    this._fired = true;
		this.communication.sendMessage('fireMissile', { 
        missileid: 'missile-' + this.entity.getId() + this.missileidCounter++, 
        sourceid: this.entity.getId(), 
        targetid: this._trackedTarget.getId()
    });    
  }
};

exports.FiringController = FiringController;
