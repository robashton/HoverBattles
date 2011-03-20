var blah = blah || {};

blah.Coordinator = function(scene, controller, renderContext) {
	this._scene = scene;
	this._controller = controller;
	this._renderContext = renderContext;
	this._timeAtLastFrame = new Date().getTime();
	this._idealTimePerFrame = 1000 / 30;
	this._leftover = 0.0;
};

blah.Coordinator.prototype.tick = function() {

	var timeAtThisFrame = new Date().getTime();
	var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this._controller.doLogic();
		this._scene.doLogic();
	}
	
	this._scene.renderScene(this._renderContext);
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;	

};
