var KeyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};
var KeyboardStates = {};

var HovercraftController = {
    doLogic: function(){        
        if(KeyboardStates[KeyCodes.W]) {
		    this.impulseForward(0.2);
    	} 
        else if(KeyboardStates[KeyCodes.S]) {
        	this.impulseBackward(0.1);
    	}    
    	if(KeyboardStates[KeyCodes.D]) {
        	this.impulseRight(0.05);
    	}
        else if(KeyboardStates[KeyCodes.A]) {
            this.impulseLeft(0.05);
    	}
        if(KeyboardStates[KeyCodes.Space]) {
            this.impulseUp(1.0);
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