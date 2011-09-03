var KeyCodes = {
    S:83,
    X:88, 
    W: 87, 
    D: 68, 
    A: 65, 
    Space: 32,
    RCTRL: 17
};

KeyboardStates = {};

var HovercraftController = function(targetId, scene){
  this.targetId = targetId;
  this.scene = scene;
  
  this.forwards = false;
  this.backward = false;
  this.left = false;
  this.right = false;
  this.jump = false;
  
  var controller = this;
  setInterval(function() { controller.processInput(); }, 1000 / 30);
  
  this.registerKeyboardMappings();
  
};

HovercraftController.prototype.registerKeyboardMappings = function() {
  this.keyboardMappings = {};
  this.registerKeyboardMapping(KeyCodes.W, 'startForward', 'cancelForward');
   this.registerKeyboardMapping(KeyCodes.S, 'startBackward', 'cancelBackward');
    this.registerKeyboardMapping(KeyCodes.A, 'startLeft', 'cancelLeft');
     this.registerKeyboardMapping(KeyCodes.D, 'startRight', 'cancelRight');
      this.registerKeyboardMapping(KeyCodes.Space, 'startUp', 'cancelUp');
};

HovercraftController.prototype.registerKeyboardMapping = function(code, onKeyboardDown, onKeyboardUp){
  this.keyboardMappings[code] = {
    down: onKeyboardDown,
    up: onKeyboardUp,
    state: false
  };
}

HovercraftController.prototype.processInput = function(){
  
  for(var code in this.keyboardMappings){
    var mapping = this.keyboardMappings[code];
    
    if(KeyboardStates[code] && !mapping.state){
      this.scene.sendCommand(mapping.down, { id: this.targetId});
      mapping.state = true;
    }
    else if(!KeyboardStates[code] && mapping.state){
       this.server.sendMessage(mapping.up, { id: this.targetId});
       mapping.state = false;
    } 
    
  }
    
};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.HovercraftController = HovercraftController;