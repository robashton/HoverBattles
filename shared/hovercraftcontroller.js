var KeyCodes = {
    S:83,
    X:88, 
    W: 87, 
    D: 68, 
    A: 65, 
    Space: 32,
    RCTRL: 17
};
var KeyboardStates = {};


var HovercraftController = function(entity, server){
  this.entity = entity;
  this.server = server;
  
  var controller = this;
  setInterval(function() { controller.processInput(); }, 1000 / 30);
};

HovercraftController.prototype.processInput = function(){
  if(KeyboardStates[KeyCodes.W]) {
        this.entity.impulseForward();
        this.server.sendMessage('message', { method: 'impulseForward' });
	} 
    else if(KeyboardStates[KeyCodes.S]) {
        this.entity.impulseBackward();
        this.server.sendMessage('message', { method: 'impulseBackward' });
	}    
	if(KeyboardStates[KeyCodes.D]) {
        this.entity.impulseRight();
        this.server.sendMessage('message', { method: 'impulseRight' });
	}
    else if(KeyboardStates[KeyCodes.A]) {
        this.entity.impulseLeft();
        this.server.sendMessage('message', { method: 'impulseLeft' });
	}
    if(KeyboardStates[KeyCodes.Space]) {
        this.entity.impulseUp();
        this.server.sendMessage('message', { method: 'impulseUp' });
    }
    
    /*
    if(KeyboardStates[KeyCodes.RCTRL]) {
       if(this.entity.canFire())
       {
            this.server.sendMessage('request_fire', {});
       }
    } */
};

document.onkeydown = function(event) { 
    KeyboardStates[event.keyCode] = true;   

};
document.onkeyup = function(event) { 
    KeyboardStates[event.keyCode] = false;
};

exports.HovercraftController = HovercraftController;