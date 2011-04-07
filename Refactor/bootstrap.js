var blah = blah || {};

blah.Application = function(target, root) {
  this._target = target;  
  this._root = root || '/';
  this.context = null;
  this._timeAtLastFrame = new Date().getTime();
  this._idealTimePerFrame = 1000 / 30;
  this._leftover = 0.0;
};

blah.Application.prototype.init = function(finishedCallback){
    var application = this;
    LazyLoad.js([
            this._root + 'glMatrix-0.9.5.min.js',
            this._root + 'rendercontext.js',
            this._root + 'scene.js',
            this._root + 'entity.js',
            this._root + 'model.js',
            this._root + 'texture.js',
            this._root + 'defaulttextureloader.js',
            this._root + 'defaultmodelloader.js',
            '/Shaders.js',
            this._root + 'resources.js',
            this._root + 'camera.js',
            
            this._root + 'landchunkloader.js',
            this._root + 'landchunk.js',
            this._root + 'landscapecontroller.js',
            this._root + 'hovercraftfactory.js',
            this._root + 'hovercraft.js',
        ]
        , function () {            
            var context = new blah.RenderContext();
            context.init(application._target);
            application.go(context);
        finishedCallback();
    });    
};

blah.Application.prototype.go = function(context) {
    this.context = context;
    this.scene = new blah.Scene();
    this.resources = new blah.ResourceManager(this);
    var app = this;
};

blah.Application.prototype.tick = function(){
  
    var timeAtThisFrame = new Date().getTime();
	var timeSinceLastDoLogic = (timeAtThisFrame - this._timeAtLastFrame) + this._leftover;
	var catchUpFrameCount = Math.floor(timeSinceLastDoLogic / this._idealTimePerFrame);
	
	for(var i = 0 ; i < catchUpFrameCount; i++){
		this.scene.doLogic();
	}
	
	this._leftover = timeSinceLastDoLogic - (catchUpFrameCount * this._idealTimePerFrame);
	this._timeAtLastFrame = timeAtThisFrame;
  
};

blah.Application.prototype.render = function(){
   this.scene.render(this.context);  
};