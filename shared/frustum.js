mat4 = require('./glmatrix').mat4;

var Frustum = function(projectionMatrix) {   
 this.projection = projectionMatrix;
 this.transform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
 mat4.identity(this.transform);
 
 this.planes = {       
     left: [0,0,0,0],
     right: [0,0,0,0],
     top: [0,0,0,0],
     bottom: [0,0,0,0],
     near: [0,0,0,0],
     far: [0,0,0,0]    
 };
 
 this.extractPlanes();
};

Frustum.Create = function(left, right, top, bottom, near, far){
  var projection =   mat4.frustum(left, right, bottom,top, near, far);
  return new Frustum(projection);
};

Frustum.prototype.setTransform = function(transform) {
  this.transform = transform;
  this.extractPlanes();
};

Frustum.prototype.extractPlanes = function() {
    var transformedMatrix = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
    mat4.multiply(this.projection, this.transform, transformedMatrix);
    
    // Left plane
    this.planes.left[0] = transformedMatrix[12] + transformedMatrix[0];
    this.planes.left[1]= transformedMatrix[13] + transformedMatrix[1];
    this.planes.left[2] = transformedMatrix[14] + transformedMatrix[2];
    this.planes.left[3] = transformedMatrix[15] + transformedMatrix[3];
 
    // Right plane
    this.planes.right[0] = transformedMatrix[12] - transformedMatrix[0];
    this.planes.right[1] = transformedMatrix[13] - transformedMatrix[1];
    this.planes.right[2] = transformedMatrix[14] - transformedMatrix[2];
    this.planes.right[3] = transformedMatrix[15] - transformedMatrix[3];
 
    // Top plane
    this.planes.top[0] = transformedMatrix[12] - transformedMatrix[4];
    this.planes.top[1] = transformedMatrix[13] - transformedMatrix[5];
    this.planes.top[2] = transformedMatrix[14] - transformedMatrix[6];
    this.planes.top[3] = transformedMatrix[15] - transformedMatrix[7];
 
    // Bottom plane
    this.planes.bottom[0] = transformedMatrix[12] + transformedMatrix[4];
    this.planes.bottom[1] = transformedMatrix[13] + transformedMatrix[5];
    this.planes.bottom[2] = transformedMatrix[14] + transformedMatrix[6];
    this.planes.bottom[3] = transformedMatrix[15] + transformedMatrix[7];
 
    // Near plane
    this.planes.near[0] = transformedMatrix[12] + transformedMatrix[8];
    this.planes.near[1] = transformedMatrix[13] + transformedMatrix[9];
    this.planes.near[2] = transformedMatrix[14] + transformedMatrix[10];
    this.planes.near[3] = transformedMatrix[15] + transformedMatrix[11];
 
    // Far plane
    this.planes.far[0] = transformedMatrix[12] - transformedMatrix[8];
    this.planes.far[1] = transformedMatrix[13] - transformedMatrix[9];
    this.planes.far[2] = transformedMatrix[14] - transformedMatrix[10];
    this.planes.far[3] = transformedMatrix[15] - transformedMatrix[11];    
    
    // vec3 should ignore the W component
    vec3.normalize(this.planes.left);
    vec3.normalize(this.planes.right);
    vec3.normalize(this.planes.top);
    vec3.normalize(this.planes.bottom);
    vec3.normalize(this.planes.near);
    vec3.normalize(this.planes.far);
};

Frustum.prototype.intersectSphere = function(sphere) {
    for(i in this.planes){
        var plane = this.planes[i];        
        var distance =  plane[0] * sphere.centre[0] +
                        plane[1] * sphere.centre[1] + 
                        plane[2] * sphere.centre[2] + 
                        + plane[3];
      if(distance + sphere.radius < 0) return false;
    }
    return true;
};

exports.Frustum = Frustum;