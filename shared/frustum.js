mat4 = require('./glmatrix').mat4;
debug = require('./debug');

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
    mat4.multiply(this.projection, this.transform,transformedMatrix);
    
    
    // Left plane
    this.planes.left[0] = transformedMatrix[3] + transformedMatrix[0];
    this.planes.left[1] = transformedMatrix[7] + transformedMatrix[4];
    this.planes.left[2] = transformedMatrix[11] + transformedMatrix[8];
    this.planes.left[3] = transformedMatrix[15] + transformedMatrix[12];
 
    // Right plane
    this.planes.right[0] = transformedMatrix[3] - transformedMatrix[0];
    this.planes.right[1] = transformedMatrix[7] - transformedMatrix[4];
    this.planes.right[2] = transformedMatrix[11] - transformedMatrix[8];
    this.planes.right[3] = transformedMatrix[15] - transformedMatrix[12];
 
    // Top plane
    this.planes.top[0] = transformedMatrix[3] - transformedMatrix[1];
    this.planes.top[1] = transformedMatrix[7] - transformedMatrix[5];
    this.planes.top[2] = transformedMatrix[11] - transformedMatrix[9];
    this.planes.top[3] = transformedMatrix[15] - transformedMatrix[13];
 
    // Bottom plane
    this.planes.bottom[0] = transformedMatrix[3] + transformedMatrix[1];
    this.planes.bottom[1] = transformedMatrix[7] + transformedMatrix[5];
    this.planes.bottom[2] = transformedMatrix[11] + transformedMatrix[9];
    this.planes.bottom[3] = transformedMatrix[15] + transformedMatrix[13];
 
    // Near plane
    this.planes.near[0] = transformedMatrix[3] + transformedMatrix[2];
    this.planes.near[1] = transformedMatrix[7] + transformedMatrix[6];
    this.planes.near[2] = transformedMatrix[11] + transformedMatrix[10];
    this.planes.near[3] = transformedMatrix[15] + transformedMatrix[14];
 
    // Far plane
    this.planes.far[0] = transformedMatrix[3] - transformedMatrix[2];
    this.planes.far[1] = transformedMatrix[7] - transformedMatrix[6];
    this.planes.far[2] = transformedMatrix[11] - transformedMatrix[10];
    this.planes.far[3] = transformedMatrix[15] - transformedMatrix[14];
    
    for(i in this.planes){
        var plane = this.planes[i];
        var length = vec3.length(plane);
        plane[0] /= length;
        plane[1] /= length;
        plane[2] /= length;
        plane[3] /= length;     
    }
};

Frustum.prototype.intersectSphere = function(sphere) {
    for(i in this.planes){
        var plane = this.planes[i];        
        var distance =  plane[0] * sphere.centre[0] +
                        plane[1] * sphere.centre[1] + 
                        plane[2] * sphere.centre[2] +
                        plane[3];
                        
      debug[i] = plane;
      if(distance <= -sphere.radius) return false;
    }
    return true;
};

exports.Frustum = Frustum;