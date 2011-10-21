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
		this.communication.sendMessage('fireMissile', { sourceid: this.entity.getId(), targetid: this._trackedTarget.getId()});
	}
}

exports.FiringController = FiringController;
