var Controller = function(scene) {
  this.scene = scene;
  this._timeAtLastFrame = new Date().getTime();
  this._idealTimePerFrame = 1000 / 30;
  this._leftover = 0.0;
  this._first = true;
};

Controller.prototype.tick = function(){
    var timeAtThisFrame = new Date().getTime();
    var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
    if(this._first) { catchUpFrameCount = 1; timeSinceLastDoLogic = this._idealTimePerFrame; this._first = false; }
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this.scene.doLogic();
	}
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;  
};

exports.Controller = Controller;