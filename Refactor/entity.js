var blah = blah || {};

blah.Entity = function(id){
    this._model = null;
	this._id = id;
	this.position = vec3.create();
    this.rotationY = 0;
	this._scene = null;
};

blah.Entity.prototype.getId = function(){
	return this._id;
};

blah.Entity.prototype.setModel = function(model) {
   this._model = model;  
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

blah.Entity.prototype.doLogic = function() { };

blah.Entity.prototype.setScene = function(scene) {
	this._scene = scene;
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
    
    var modelViewMatrix = mat4.create();
    mat4.multiply(worldMatrix,viewMatrix, modelViewMatrix);
    
    var normalMatrix = mat3.create();
    mat4.toInverseMat3(worldMatrix, normalMatrix);
    mat3.transpose(normalMatrix);

	var program = context.setActiveProgram(this._model.getProgram());
    
	this._model.upload(context);

	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormal"), false, normalMatrix);

	this._model.render(context);
};
