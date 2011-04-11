var Camera = require('camera').Camera;

var Scene = function(){
    this._entities = {};
    this.camera = new Camera();
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
};

Scene.prototype.render = function(context){
    var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for(var i in this._entities) {
		var entity = this._entities[i];
		entity.render(context);
	}  
};

exports.Scene = Scene;