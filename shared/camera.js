var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Camera = function(location){
    this.location = location || vec3.create();
    this.lookAt = vec3.create();
    this.width = 800;
    this.height = 600;
    this.up = vec3.create([0,1,0]);
    this.projMatrix = mat4.create();
    this.viewMatrix = mat4.create();
};

Camera.prototype.setLocation = function(location) {
	this.location = location;
};

Camera.prototype.updateMatrices = function(){
	mat4.perspective(45, this.width / this.height, 1.0, 5000.0, this.projMatrix);
    mat4.lookAt(this.location, this.lookAt, this.up, this.viewMatrix);    
};

Camera.prototype.getProjectionMatrix = function() {
    return this.projMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    return this.viewMatrix;
};

exports.Camera = Camera;