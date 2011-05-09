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
  
  var controller = this;
  setInterval(function() { controller.processInput(); }, 1000 / 30);
};

HovercraftController.prototype.processInput = function(){
  if(KeyboardStates[KeyCodes.W]) {
        this.server.sendMessage('impulseForward', { id: this.targetId });
	} 
    else if(KeyboardStates[KeyCodes.S]) {
        this.server.sendMessage('impulseBackward', { id: this.targetId });
	}    
	if(KeyboardStates[KeyCodes.D]) {
        this.server.sendMessage('impulseRight', { id: this.targetId });
	}
    else if(KeyboardStates[KeyCodes.A]) {
        this.server.sendMessage('impulseLeft', { id: this.targetId });
	}
    if(KeyboardStates[KeyCodes.Space]) {
        this.server.sendMessage('impulseUp', { id: this.targetId });
    }
};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.HovercraftController = HovercraftController;