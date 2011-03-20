var blah = blah || {};

blah.Scene = function(){
	this._entities = {};
	this.camera = new blah.Camera([0,0,0]);
};

blah.Scene.prototype.addEntity = function(entity){
	this._entities[entity.getId()] = entity;
	entity.setScene(this);
};

blah.Scene.prototype.getEntity = function(id){
	return this._entities[id];
};

blah.Scene.prototype.msg = function(msg) {
		
	switch(msg) {
		case 'cameraback':
			this.camera.backwards(0.1);
		break;
		case 'cameraforward':
			this.camera.forwards(0.1);
		case 'cameraleft':
			this.camera.left(0.1);
		break;
		case 'cameraright':
			this.camera.right(0.1);
		break;
		break;
	}
};


blah.Scene.prototype.doLogic = function() {

	// Screw the entities for now

};


blah.Scene.prototype.renderScene = function(context){
	var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);

	for(var i in this._entities) {
		var entity = this._entities[i];

		var viewMatrix = this.camera.getViewMatrix();

		var worldMatrix = mat4.create();
		mat4.identity(worldMatrix);
		mat4.translate(worldMatrix, entity.position);

		var model = entity.getModel();
		var program = context.setActiveProgram(model.getProgram());

		model.uploadBuffers(context);
	
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);

		model.render(context);
	}
};
