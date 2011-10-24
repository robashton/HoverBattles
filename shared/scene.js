var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var Camera = require('./camera').Camera;
var CollisionManager = require('./collisionmanager').CollisionManager;

var Scene = function(app){
    this._entities = {};
    this.app = app;
    this.camera = new Camera();
    this.collisionManager = new CollisionManager();
};

Scene.prototype.sendCommand = function(commandName, data) {
	
};

Scene.prototype.withEntity = function(id, callback) {
  var entity = this.getEntity(id);
  if(entity) {
    callback(entity);
  } else console.log('Failed to find entity ' + id);
};

Scene.prototype.getEntity = function(id) {
  return this._entities[id];  
};

Scene.prototype.addEntity = function(entity){
    this._entities[entity.getId()] = entity;
	entity.setScene(this);
};

Scene.prototype.removeEntity = function(entity) {
	entity.setScene(undefined);
	delete this._entities[entity.getId()];
};

Scene.prototype.doLogic = function() {
    for(i in this._entities){ 
        this._entities[i].doLogic();
    }
    
    for(i in this._entities){ 
        for(j in this._entities){ 
            if(i === j) continue;
            
            // Note: I know this is sub-optimal
            // When it becomes an issue I'll go all DoD on its ass
            // But not until then
            var entityOne = this._entities[i];
            var entityTwo = this._entities[j];
            this.collisionManager.processPair(entityOne, entityTwo);            
        }
    }
};

Scene.prototype.render = function(context){
    var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    // Yuck yuck yuck
    this.camera.width = gl.viewportWidth;
    this.camera.height = gl.viewportHeight;
    this.camera.updateMatrices();

	for(var i in this._entities) {
		var entity = this._entities[i];
        
        if(entity.getSphere){
            if(!this.camera.frustum.intersectSphere(entity.getSphere())){
                continue;
            }
        }
        
		entity.render(context);
	}  
};

exports.Scene = Scene;
