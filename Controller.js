var blah = blah || {};

blah.keyCodes = {S:83,X:88, W: 87, D: 68, A: 65, Space: 32};

blah.Controller = function(scene) {
	this._scene = scene;
	this._keyStates = {};
	var controller = this;

	document.onkeydown = function(event) { 
		controller.onKeyDown.call(controller, event);
	};
	document.onkeyup = function(event) { 
		controller.onKeyUp.call(controller, event);
	};
};

blah.Controller.prototype.onKeyDown = function(event) {
	this._keyStates[event.keyCode] = true;
};

blah.Controller.prototype.onKeyUp = function(event) {
	this._keyStates[event.keyCode] = false;
};

blah.Controller.prototype.doLogic = function() {
    var hovercraft = this._scene.getEntity("player");
    var terrain = this._scene.getEntity("terrain");
    
    
    
    
	if(this._keyStates[blah.keyCodes.W]) {
//		hovercraft.position[2] -= 0.5;
    	this._scene.camera._location[2] -= 0.5;
	} else if(this._keyStates[blah.keyCodes.S])
	{
//		hovercraft.position[2] += 0.5;
    	this._scene.camera._location[2] += 0.5;
	}

	if(this._keyStates[blah.keyCodes.D]){
  //  	hovercraft.position[0] += 0.5;
        this._scene.camera._location[0] += 0.5;
	}	else if(this._keyStates[blah.keyCodes.A])
	{
    //    hovercraft.position[0] -= 0.5;
        this._scene.camera._location[0] -= 0.5;
	}

    this._scene.camera._location[1] = terrain.getHeightAt(
             this._scene.camera._location[0],
             this._scene.camera._location[2]
              ) + 1;
};
