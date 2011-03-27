var blah = blah || {};

blah.Entity = function(id, model){
	this._model = model;
	this._id = id;
	this.position = vec3.create();
    this.rotationY = 0;
	this._scene = null;
};

blah.Entity.prototype.getId = function(){
	return this._id;
};

blah.Entity.prototype.getModel = function(){
	return this._model;
};

blah.Entity.prototype.attach = function(logic) {
    var oldLogic = this.doLogic;
    this.doLogic = function(){
      oldLogic.call(this);
      logic.call(this);
    };
};

blah.Entity.prototype.doLogic = function() {
    
};

blah.Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};

blah.Entity.prototype.activate = function(context) {
    if(!this._model) { return; }
	this._model.createBuffers(context);
};

blah.Entity.prototype.deactivate = function(context) {
    if(!this._model) { return; }
	this._model.destroyBuffers(context);
};

blah.Entity.prototype.render = function(context){
    if(!this._model) { return; }
	var gl = context.gl;

	var viewMatrix = this._scene.camera.getViewMatrix();
	var projectionMatrix = this._scene.camera.getProjectionMatrix(gl);

	var worldMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.translate(worldMatrix, this.position);
    mat4.rotateY(worldMatrix, this.rotationY);


	var program = context.setActiveProgram(this._model.getProgram());
	this._model.uploadBuffers(context);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);

	this._model.render(context);
};
