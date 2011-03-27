var blah = blah || {};

blah.keyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

blah.Controller = function(scene) {
	this._scene = scene;
	this._keyStates = {};
	var controller = this;
    this.mousePosition = {
        x: 0,
        y: 0
    };
    this.lastMousePosition = {
        x: 0,
        y: 0
    };
    
    this.mouseInitialized = false;

	document.onkeydown = function(event) { 
		controller.onKeyDown.call(controller, event);
	};
	document.onkeyup = function(event) { 
		controller.onKeyUp.call(controller, event);
	};
    document.onmousemove = function(event) {
        controller.onMouseMove.call(controller, event);  
    };
};

blah.Controller.prototype.onKeyDown = function(event) {
	this._keyStates[event.keyCode] = true;
};

blah.Controller.prototype.onKeyUp = function(event) {
	this._keyStates[event.keyCode] = false;
};

blah.Controller.prototype.onMouseMove = function(event) {
  this.mousePosition.x = event.clientX;
  this.mousePosition.y = event.clientY;
  
  if(!this.mouseInitialized){
    this.lastMousePosition.x = event.clientX;
    this.lastMousePosition.y = event.clientY;
    this.mouseInitialized = true;
  }
};

blah.Controller.prototype.doLogic = function() {
    var hovercraft = this._scene.getEntity("player");
    var terrain = this._scene.getEntity("terrain");
        
	if(this._keyStates[blah.keyCodes.W]) {
		hovercraft.impulseForward(0.2);
	} else if(this._keyStates[blah.keyCodes.S])
	{
    	hovercraft.impulseBackward(0.1);
	}

	if(this._keyStates[blah.keyCodes.D]){
    	hovercraft.impulseRight(0.05);
	}
    else if(this._keyStates[blah.keyCodes.A])
	{
        hovercraft.impulseLeft(0.05);
	}
    
    // Yes, gonna sort this responsibility out once I get it functional
    var delta = this.lastMousePosition.y - this.mousePosition.y;
    hovercraft.cameraVertical(-delta * 0.1);
    
    this.lastMousePosition.y = this.mousePosition.y;
    this.lastMousePosition.x = this.mousePosition.x;
    
    
    
    
};
