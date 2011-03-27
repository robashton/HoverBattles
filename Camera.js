var blah = blah || {};

blah.Camera = function(location){
	this._location = location;
    this._lookAt = vec3.create();
    this._up = vec3.create([0,1,0]);
};


blah.Camera.prototype.setLocation = function(location){
	this._location = location;
};

blah.Camera.prototype.getProjectionMatrix = function(gl) {
	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);
	return projectionMatrix;
};

blah.Camera.prototype.getViewMatrix = function(){ 	
    var viewMatrix = mat4.create();
    mat4.lookAt(this._location, this._lookAt, this._up, viewMatrix);
	return viewMatrix;	
};
