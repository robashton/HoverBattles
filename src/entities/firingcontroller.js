exports.FiringController = function() {
	var self = this;

  var missileidCounter = 0;
  var trackingStartTime = null;
  var trackedTarget = null;
  var status = "null";
	var trackedMissileId  = null;
  var fired = false;

  var onTrackingTarget = function(ev) {
	  trackingStartTime = new Date();
	  trackedTarget = ev.target;
    status = "tracking";
  };
	
  var onCancelledTrackingTarget = function(ev) {
    if(status !== "fired") 
      self.resetFiringState();
  };
	
  self.doLogic = function() {
	  if(!trackedTarget || fired) return;
	  var currentTime = new Date();
	  var timeElapsedSinceStartedTracking = currentTime - trackingStartTime;
	  if(timeElapsedSinceStartedTracking > 1500 && status === "tracking") {
		  status = "locked";
      self.raiseServerEvent('missileLock', {
        sourceid: self.getId(),
        targetid: trackedTarget.getId()
      });
    }
  };

  var onFireRequest = function() {
    self.tryFireMissile();
  };

  self.resetFiringState = function() {
    trackingStartTime = null;
    trackedTarget = null;
    status = "null";
    trackedMissileId = null;
  };

  self.tryFireMissile = function() {
    if(status !== "locked") return;
    status = "fired";
    var missileid = 'missile-' + self.getId() + missileidCounter++;
    trackedMissileId = missileid;
	  self.raiseServerEvent('fireMissile', { 
        missileid: missileid, 
        sourceid: self.getId(), 
        targetid: trackedTarget.getId()
    });    
  };  

  self.addEventHandler('trackingTarget', onTrackingTarget);
  self.addEventHandler('cancelledTrackingTarget', onCancelledTrackingTarget);
  self.addEventHandler('fireRequest', onFireRequest);
};
