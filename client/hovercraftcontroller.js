var blah = blah || {};

blah.KeyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

blah.HovercraftController = {
    doLogic: function(){        
        if(blah.KeyboardStates[blah.KeyCodes.W]) {
		    this.impulseForward(0.2);
    	} 
        else if(blah.KeyboardStates[blah.KeyCodes.S]) {
        	this.impulseBackward(0.1);
    	}    
    	if(blah.KeyboardStates[blah.KeyCodes.D]) {
        	this.impulseRight(0.05);
    	}
        else if(blah.KeyboardStates[blah.KeyCodes.A]) {
            this.impulseLeft(0.05);
    	}
        if(blah.KeyboardStates[blah.KeyCodes.Space]) {
            this.impulseUp(1.0);
        }
    }
};