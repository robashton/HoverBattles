exports.FiringController = function() {
	var self = this;

  var missileidCounter = 0;
  var trackingStartTime = null;
  var trackedTarget = null;
  var firing = false;

  var onTrackingTarget = function(ev) {
	  trackingStartTime = new Date();
	  trackedTarget = ev.target;
  };
	
  var onCancelledTrackingTarget = function(ev) {
    self.resetFiringState();
  };
	
  self.doLogic = function() {
/*	  if(!trackedTarget || fired) return;
	  var currentTime = new Date();
	  var timeElapsedSinceStartedTracking = currentTime - trackingStartTime;
	  if(timeElapsedSinceStartedTracking > 1500 && status === "tracking") {
		  status = "locked";
      self.raiseServerEvent('missileLock', {
        sourceid: self.getId(),
        targetid: trackedTarget.getId()
      });
    } */
  };

  var onStartedFiringMissile = function() {
    firing = true;
  };
  
  var onFinishedFiringMissile = function() {
    if(firing) {
      self.tryFireMissile();
      firing = false;
    }
  };
  
  self.startFiringMissile = function() {
    self.raiseServerEvent('startedFiring');
  };
  
  self.finishFiringMissile = function() {
    self.raiseServerEvent('finishedFiring');
  };

  self.resetFiringState = function() {
    trackingStartTime = null;
    trackedTarget = null;
  };

  self.tryFireMissile = function() {
    if(!trackedTarget) return;
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
  self.addEventHandler('startedFiring', onStartedFiringMissile);
  self.addEventHandler('finishedFiring', onFinishedFiringMissile);
};

exports.FiringController.Type = "FiringController"; 
