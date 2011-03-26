var m = require('./sylvester-common.js');

// Wrapping Sylvester with glMatrix types so when glMatrix is node-ish
// By either myself or somebody else I can just delete this file server-side
vec3 = {};


vec3.create = function(data) {
  return m.$V(data || [0,0,0]);  
};

vec3.subtract = function(a, b, c) {
  c = a.subtract(b);
};

vec3.cross = function(a, b, c) {
  c = a.cross(b);  
};

vec3.normalize = function(input, output) {
    output = input.toUnitVector();  
};

vec3.add = function(input, addition) { 
    var result = input.add(addition);
    input.setElements(result.elements);
};

vec3.dot = function(v1, v2) {
  return v1.dot(v2);
};

exports.vec3 = vec3;