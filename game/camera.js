var vec3 = require('../glmatrix').vec3;
var mat4 = require('../glmatrix').mat4;


var Camera = function(location){
    this.location = location || vec3.create();
    this.lookAt = vec3.create();
    this.up = vec3.create([0,1,0]);
};


Camera.prototype.setLocation = function(location){
	this.location = location;
};

Camera.prototype.getProjectionMatrix = function(gl) {
	var projectionMatrix = mat4.create();
	mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 1024.0, projectionMatrix);
	return projectionMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    var viewMatrix = mat4.create();
    mat4.lookAt(this.location, this.lookAt, this.up, viewMatrix);
	return viewMatrix;	
};

exports.Camera = Camera;