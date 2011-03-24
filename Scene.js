var blah = blah || {};

blah.Scene = function(){
	this._entities = {};
	this._context = null;
	this.camera = new blah.Camera([0,0,0]);
};

blah.Scene.prototype.addEntity = function(entity){
	this._entities[entity.getId()] = entity;
	entity.setScene(this);
	
	if(this._context != null){
		entity.activate(this._context);
	}
};

blah.Scene.prototype.removeEntity = function(entity) {
	entity.setScene(undefined);
	if(this._context) {
		entity.deactivate(this._context);
	}
	delete this._entities[entity.getId()];
};

blah.Scene.prototype.activate = function(context){
	this._context = context;
	for(var i in this._entities) {
		this._entities[i].activate(this._context);
	}
};

blah.Scene.prototype.deactivate = function(){
	for(var i in this._entities) {
		this._entities[i].deactivate(this._context);
	}
	this._context = null;
};

blah.Scene.prototype.getEntity = function(id){
	return this._entities[id];
};

blah.Scene.prototype.msg = function(msg) {
		
	switch(msg) {
		case 'cameraback':
			this.camera.backwards(0.5);
		break;
		case 'cameraforward':
			this.camera.forwards(0.5);
		case 'cameraleft':
			this.camera.left(0.5);
		break;
		case 'cameraright':
			this.camera.right(0.5);
		break;
		break;
	}
};


blah.Scene.prototype.doLogic = function() {

	// Screw the entities for now

};


blah.Scene.prototype.renderScene = function(){
	if(this._context == null) { throw "The scene needs activating before you render, doofus"; }
	var gl = this._context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	for(var i in this._entities) {
		var entity = this._entities[i];
		entity.render(this._context);
	}
};
