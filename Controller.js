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
	if(this._keyStates[blah.keyCodes.W]) {
		this._scene.msg('cameraforward');
	} else if(this._keyStates[blah.keyCodes.S])
	{
		this._scene.msg('cameraback');
	}

	if(this._keyStates[blah.keyCodes.D]){
		this._scene.msg('cameraright');
	}	else if(this._keyStates[blah.keyCodes.A])
	{
		this._scene.msg('cameraleft');
	}
};
