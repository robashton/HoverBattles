var vec3 = require('../thirdparty/glmatrix').vec3;

exports.Bot = function() {
  var self = this;
  var state = 'none';
  var currentTarget = vec3.create([0,0,0]);
  
  self.doLogic = function() {
    determineState();
    stateHandlers[state]();    
  };  
  
  var cancelAllInput = function() {
    self.cancelLeft();
    self.cancelRight();
    self.cancelForward();
    self.cancelBackward();
    self.cancelUp();  
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
    
    if(self.getId() === 'bot-0')
       console.log(distance);
    
    if(distance < 10)
      currentTarget = createRandomTargetWithinWorld();
  };
  
  var updateInputTowardsCurrentTarget = function() {
    
  };
};










