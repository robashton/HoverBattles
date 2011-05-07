var Frustum = function(left, right, bottom, top, near, far) {
  this.left = left;
  this.right = right;
  this.bottom = bottom;
  this.top = top;
  this.near = near;
  this.far = far;
};

var AABB = function(min, max) {
    this.min = min;
    this.max = max;    
};