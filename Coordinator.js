var blah = blah || {};

blah.Coordinator = function(scene, controllers, renderContext) {
	this._scene = scene;
	this._controllers = controllers;
	this._renderContext = renderContext;
	this._timeAtLastFrame = new Date().getTime();
	this._idealTimePerFrame = 1000 / 30;
	this._leftover = 0.0;
	this._scene.activate(this._renderContext);
};

blah.Coordinator.prototype.tick = function() {

	var timeAtThisFrame = new Date().getTime();
	var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
	for(var i = 0 ; i < catchUpFrameCount; i++){
		for(var c in this._controllers) {
			this._controllers[c].doLogic();
		}
		this._scene.doLogic();
	}
	
	this._scene.renderScene(this._renderContext);
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;
};
