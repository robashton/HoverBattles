var vec3 = require('../thirdparty/glmatrix').vec3;

exports.Bot = function(communication) {
  var self = this;
  var state = 'none';
  var currentTarget = vec3.create([0,0,0]);
  
  var inputStates = {};
  
  self.doLogic = function() {
    determineState();
    stateHandlers[state]();    
  };  
  
  var determineState = function() {
    if(state === 'none')
      switchToAimlessState();
  };
  
  var switchToAimlessState = function() {
    state = 'aimless';
    currentTarget = createRandomTargetWithinWorld();
    cancelAllInput();
  };
  
  var createRandomTargetWithinWorld = function() {
    return vec3.create([Math.random() * 1280.0 - 640.0, 0, Math.random() * 1280.0 - 640.0]);
  };
    
  var stateHandlers = {
    aimless: function() {
      adjustAimlessTargetIfNecessary();
      updateInputTowardsCurrentTarget();
    }
  };    
  
  var adjustAimlessTargetIfNecessary = function() {
    var difference = vec3.create([0,0,0]);
    vec3.subtract(currentTarget, self.position, difference);
    difference[1] = 0;
    var distance = vec3.length(difference);
    
    if(distance < 10)
      currentTarget = createRandomTargetWithinWorld();
  };
  
  var updateInputTowardsCurrentTarget = function() {
    var desiredRotationY =  calculateRotationTowardsTarget() - Math.PI;
    
    var difference = desiredRotationY - self.rotationY;
    if(difference > 0.05) {
      startLeft();
      cancelRight();
      cancelForward();
    } else if (difference < -0.05) {
      cancelLeft();
      startRight();
      cancelForward();
    } else {
      cancelLeft();
      cancelRight();
      startForward();
    }
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
};










