var vec3 = require('../thirdparty/glmatrix').vec3;

exports.Bot = function(communication) {
  var self = this;
  var state = 'none';
  
  var currentTargetId = null;
  var currentTarget = vec3.create([0,0,0]);
  
  var inputStates = {};
  var ticksToWaitBeforeFiring = 30;
  var ticksWaitedBeforeFiring = 0;
  
  self.doLogic = function() {
    determineState();
    stateHandlers[state]();    
  };  
  
  var determineState = function() {
    if(state === 'none') {
      switchToAimlessState();
      return;
     }
  };
  
  var switchToAimlessState = function() {
    state = 'aimless';
    currentTarget = createRandomTargetWithinWorld();
    cancelAllInput();
  };
  
  var switchToFollowingTargetState = function() {
    state = 'followingtarget';
  }; 
  
  var switchToFiringState = function() {
    ticksToWaitBeforeFiring = Math.floor(Math.random() * 90 + 60);
    ticksWaitedBeforeFiring = 0;
    state = "firing";
  };
  
  var createRandomTargetWithinWorld = function() {
    return vec3.create([Math.random() * 1280.0 - 640.0, 0, Math.random() * 1280.0 - 640.0]);
  };
    
  var stateHandlers = {
    aimless: function() {
      adjustAimlessTargetIfNecessary();
      updateInputTowardsCurrentTarget();
    },
    followingtarget: function() {
      tryAndFire();
      adjustAimedTarget();
      updateInputTowardsCurrentTarget();
    },
    firing: function() {
      tryAndReleaseFire();
      adjustAimedTarget();
      updateInputTowardsCurrentTarget();
    }
  };    

  var tryAndFire = function() {
    self.startFiringMissile();
    switchToFiringState();
  };
  
  var tryAndReleaseFire = function() {
    ticksWaitedBeforeFiring++;
    if(ticksWaitedBeforeFiring >= ticksToWaitBeforeFiring) {
      self.finishFiringMissile();
      switchToAimlessState();
    }
  };
  
  var adjustAimedTarget = function() {
    self._scene.withEntity(currentTargetId, function(target) {
      currentTarget = target.position;
    });
  };
  
  var adjustAimlessTargetIfNecessary = function() {  
    var distanceToCurrentTarget = calculateDistanceToCurrentTarget();
        
    if(distanceToCurrentTarget > 10) return;
    if(tryToAllocateAppropriateTargetInSight()) return;
    
    currentTarget = createRandomTargetWithinWorld();
  };
  
  var tryToAllocateAppropriateTargetInSight = function() {
   var found = false;
   self.lookForCraftInVision(0.75, 1000,
      function(foundEntity) {
        found = true;
        currentTarget = foundEntity.position;
        return false;
      },
      function(notFoundEntity) {
        // Don't care
      });
  };
  
  var calculateDistanceToCurrentTarget = function() {
    var difference = vec3.create([0,0,0]);
    vec3.subtract(currentTarget, self.position, difference);
    difference[1] = 0;
    return vec3.length(difference);
  };
  
  var updateInputTowardsCurrentTarget = function() {
    var desiredRotationY =  calculateRotationTowardsTarget() - Math.PI;
    
    var difference = normalizeRotation(desiredRotationY - self.rotationY);
      
    if(Math.abs(difference) < 0.05) {
      cancelLeft();
      cancelRight();
      startForward();
      return;
    }
        
    if(difference > 0) {
      startLeft();
      cancelRight();
      cancelForward();
    } 
    else if (difference < 0) {
      cancelLeft();
      startRight();
      cancelForward();
    }
  };
  
  var PI2 = Math.PI * 2.0;
  var normalizeRotation = function(rotation) {
    while(rotation < -Math.PI)
      rotation += PI2;
    while(rotation > Math.PI)
      rotation -= PI2;
    return rotation;   
  };
  
  var calculateRotationTowardsTarget = function() {
    return Math.atan2(currentTarget[0] - self.position[0], currentTarget[2] - self.position[2]);
  };
 
  var cancelAllInput = function() {
    cancelLeft();
    cancelRight();
    cancelForward();
    cancelBackward();
    cancelUp();  
  };
   
   var startLeft = function() {
    changeInputState('Left', true);
  }; 
  
  var cancelLeft = function() {
    changeInputState('Left', false);
  };
  
  var startRight = function() {
    changeInputState('Right', true);
  };
  
  var cancelRight = function() {
    changeInputState('Right', false);
  };
  
  var startUp = function() {
    changeInputState('Up', true);
  };
  
  var cancelUp = function() {
    changeInputState('Up', false);
  };
      
  var startForward = function() {
    changeInputState('Forward', true);
  };  
  
  var cancelForward = function() {
    changeInputState('Forward', false);
  };

  var startBackward = function() {
    changeInputState('Forward', true);
  };
  
  var cancelBackward = function() {
    changeInputState('Backward', false);
  };
  
  var changeInputState = function(state, value) {

    var oldValue = inputStates[state];
    inputStates[state] = value;
      
    if(oldValue !== value) {
      if(value)
        communication.sendMessage('start' + state, { id: self.getId() });
      else
        communication.sendMessage('cancel' + state, { id: self.getId() });    
    }
  };
  
  var onTrackingTarget = function(data) {
    startFollowingTarget(data.target.getId());
  };
  
  var onCancelledTrackingTarget = function(data) {
    switchToAimlessState();
  };
  
  var startFollowingTarget = function(targetid) {
    currentTargetId = targetid;
    switchToFollowingTargetState();
  };
      
  
  self.addEventHandler('cancelledTrackingTarget', onCancelledTrackingTarget);
  self.addEventHandler('trackingTarget', onTrackingTarget);  
};


exports.Bot.Type = "Bot";









