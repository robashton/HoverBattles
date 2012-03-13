exports.FiringController = function() {
	var self = this;

  var missileidCounter = 0;
  var trackedTarget = null;
  var firing = false;
  var maxAccuracy = 30;
  var antiAccuracy = maxAccuracy;

  var onTrackingTarget = function(ev) {
	  trackedTarget = ev.target;
  };
	
  var onCancelledTrackingTarget = function(ev) {
    self.resetFiringState();
  };
	
  self.doLogic = function() {
    if(!firing) return;
    antiAccuracy -= 0.5;
    self.raiseEvent('accuracyChanged', Math.abs(antiAccuracy) / maxAccuracy);
  };

  var onStartedFiringMissile = function() {
    firing = true;
    antiAccuracy = maxAccuracy;
  };
  
  var onFinishedFiringMissile = function() {
    if(firing) {
      self.fireMissile();
      firing = false;
    }
  };
  
  self.startFiringMissile = function() {
    if(!trackedTarget) return;
    self.raiseServerEvent('startedFiring');
  };
  
  self.finishFiringMissile = function() {
    if(!trackedTarget) return;
    self.raiseServerEvent('finishedFiring');
  };

  self.resetFiringState = function() {
    trackingStartTime = null;
    trackedTarget = null;
  };

  self.fireMissile = function() {
    if(!trackedTarget) return;
    var missileid = 'missile-' + self.getId() + missileidCounter++;
	  self.raiseServerEvent('fireMissile', { 
      missileid: missileid, 
      sourceid: self.getId(), 
      targetid: trackedTarget.getId(),
      antiAccuracy: Math.abs(antiAccuracy) / maxAccuracy
    });    
  };

  self.addEventHandler('trackingTarget', onTrackingTarget);
  self.addEventHandler('cancelledTrackingTarget', onCancelledTrackingTarget);
  self.addEventHandler('startedFiring', onStartedFiringMissile);
  self.addEventHandler('finishedFiring', onFinishedFiringMissile);
};

exports.FiringController.Type = "FiringController"; 
