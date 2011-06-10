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

var HovercraftController = function(targetId, server){
  this.targetId = targetId;
  this.server = server;
  
  this.forwards = false;
  this.backward = false;
  this.left = false;
  this.right = false;
  this.jump = false;
  
  var controller = this;
  setInterval(function() { controller.processInput(); }, 1000 / 30);
};

HovercraftController.prototype.processInput = function(){
    
   if(KeyboardStates[KeyCodes.W] && this.forwards == false) {
        this.forwards = true;
        this.server.sendMessage('startForward', { id: this.targetId });
	}
    else if(this.forwards)
    {
           this.forwards = false;
           this.server.sendMessage('cancelForward', { id: this.targetId });
    }
    
    
    if(KeyboardStates[KeyCodes.S] && this.backwards == false) {
        this.backwards = true;
        this.server.sendMessage('startBackward', { id: this.targetId });
	}
    else if(this.backwards)
    {
        this.backwards = false;
        this.server.sendMessage('cancelBackward', { id: this.targetId });
    }
	if(KeyboardStates[KeyCodes.D] && this.right == false) {
        this.right = true;
        this.server.sendMessage('startRight', { id: this.targetId });
	}
    else if(this.right) {
        this.right = false;
        this.server.sendMessage('cancelRight', { id: this.targetId });
    }
    if(KeyboardStates[KeyCodes.A] && this.left == false) {
        this.left = true;
        this.server.sendMessage('startLeft', { id: this.targetId });
	}
    else if(this.left) {
        this.left = false;
        this.server.sendMessage('cancelLeft', { id: this.targetId });
    }
    if(KeyboardStates[KeyCodes.Space] && this.jump == false) {
        this.jump = true;
        this.server.sendMessage('startUp', { id: this.targetId });
    }
    else {
        this.jump = false;
        this.server.sendMessage('cancelUp', { id: this.targetId });
    }
};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.HovercraftController = HovercraftController;