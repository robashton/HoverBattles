var vec3 = require('./glmatrix').vec3;
var vec4 = require('./glmatrix').vec4;
var mat4 = require('./glmatrix').mat4;
var Frustum = require('./frustum').Frustum;
var Sphere = require('./bounding').Sphere;

var Camera = function(location) {
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
    this.frustum = new Frustum(this.projMatrix);
    this.frustum.setTransform(this.viewMatrix);
};

Camera.prototype.getProjectionMatrix = function() {
    return this.projMatrix;
};

Camera.prototype.getViewMatrix = function(){ 	
    return this.viewMatrix;
};

Camera.prototype.transformSphereToScreen = function(sphere) {
  var difference = vec3.create([0,0,0]);
  vec3.subtract(this.location, sphere.centre, difference);
  var distance = vec3.length(difference);

  var radius = Math.atan(sphere.radius / distance);
  radius *= (this.width / (45 * Math.PI / 360.0));

  var transformMatrix = mat4.create();
  mat4.multiply(this.projMatrix, this.viewMatrix, transformMatrix);

  var centre = [sphere.centre[0], sphere.centre[1], sphere.centre[2], 1.0];
  mat4.multiplyVec4(this.viewMatrix, centre);
  mat4.multiplyVec4(this.projMatrix, centre);
  vec3.scale(centre, 1.0 / centre[3]);
  
  var halfWidth = this.width / 2.0;
  var halfHeight = this.height / 2.0;
    
  centre[0] = centre[0] * halfWidth + halfWidth;
  centre[1] = -centre[1] * halfHeight + halfHeight;

  return new Sphere(radius / 2.0, centre);
};

exports.Camera = Camera;
