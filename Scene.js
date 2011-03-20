var blah = blah || {};

blah.Scene = function(){
	this._entities = {};
};

blah.Scene.prototype.addEntity = function(entity){
	this._entities[entity.getId()] = entity;
};

blah.Scene.prototype.getEntity = function(id){
	return this._entities[id];
};


blah.Scene.prototype.renderScene = function(context){
	var gl = context.gl;

	gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
 	gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
	
	// Obviously this give us a camera concern
	var projectionMatrix = mat4.create();
	var viewMatrix = mat4.create();

	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, projectionMatrix);

	for(var i in this._entities) {
		var entity = this._entities[i];
		mat4.identity(viewMatrix);

		// For now we'll do this, but we'll need world, view and projection later
		mat4.translate(viewMatrix, entity.position);

		var model = entity.getModel();
		var program = context.setActiveProgram(model.getProgram());

		model.uploadBuffers(context);
	
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
		gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);

		model.render(context);
	}
};
