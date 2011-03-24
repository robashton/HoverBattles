var blah = blah || {};

blah.Camera = function(location){
	this._location = location;
	this._rotation = vec3.create();
};


blah.Camera.prototype.setLocation = function(location){
	this._location = location;
};

blah.Camera.prototype.forwards = function(amount) {
	this._location[2] -= amount;
};

blah.Camera.prototype.backwards = function(amount) {
	this._location[2] += amount;
};

blah.Camera.prototype.left = function(amount) {
	this._location[0] -= amount;
};

blah.Camera.prototype.right = function(amount) {
	this._location[0] += amount;
};

blah.Camera.prototype.getProjectionMatrix = function(gl) {
	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);
	return projectionMatrix;
};

blah.Camera.prototype.getViewMatrix = function(){ 	
	var viewMatrix = mat4.create();
	mat4.identity(viewMatrix);

	mat4.translate(viewMatrix,
		[
			-this._location[0],
			-this._location[1],
			-this._location[2]
		]);

	return viewMatrix;	
};
