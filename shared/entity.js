var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var mat3 = require('./glmatrix').mat3;

var Entity = function(id){
  this._model = null;
	this._id = id;
	this.position = vec3.create([0,0,0]);
  this.rotationY = 0;
	this._scene = null;
	this.eventHandlers = {};
  this.components = [];
};


Entity.prototype.getId = function(){
	return this._id;
};

Entity.prototype.setModel = function(model) {
   this._model = model;  
};

Entity.prototype.getModel = function(){
	return this._model;
};

Entity.prototype.addEventHandler = function(eventName, callback) {
	if(!this.eventHandlers[eventName])
		this.eventHandlers[eventName] = [];
	this.eventHandlers[eventName].push(callback);
};

Entity.prototype.removeEventHandler = function(eventName, callback) {
	if(!this.eventHandlers[eventName])
		this.eventHandlers[eventName] = [];

  var newItems = [];
  for(var i = 0; i < this.eventHandlers[eventName].length; i++)
      if(this.eventHandlers[eventName][i] !== callback) 
        newItems.push(this.eventHandlers[eventName][i]);
  
  this.eventHandlers[eventName] = newItems;
};

Entity.prototype.raiseEvent = function(eventName, data) {
	if(!this.eventHandlers[eventName]) return;
	for(var x = 0 ; x < this.eventHandlers[eventName].length; x++){
		var handler = 	this.eventHandlers[eventName][x];
		handler.call(this, data);
	}
};

Entity.prototype.attach = function(component, args) {
  this.components.push(component);

  var oldProperties = {};
  for(var i in this) {
    oldProperties[i] = this[i];
  }

  if(!component.apply){
    console.warn("Cannot apply component, it's written in the old style");
    return;
  }

  component.apply(this, args);

  // Note: We've ended up here because of the natural evolution of 
  // how these components have traditionally worked
  // clearly this code is sub-optimal, and it'll get fixed next time
  // these entities become painful to deal with (just like how this happened
  // last time these entities became painful to deal with)
  for(var i in this) {
    if(oldProperties[i] && oldProperties[i] !== this[i]) {
       if(i === 'doLogic') {
          var newLogic = this[i];
          var oldLogic = oldProperties[i];
          this.doLogic = function() {
            oldLogic.call(this);
            newLogic.call(this);
          }
       }
       else if(i === 'updateSync') {
          var newSendSync = this[i];
          var oldSendSync = oldProperties[i];
          this.updateSync = function(sync) {
            newSendSync.call(this, sync);
            oldSendSync.call(this, sync);
          };
       }
       else if(i === 'setSync') {
          var newRecvSync = this[i];
          var oldRecvSync = oldProperties[i];
          this.setSync = function(sync) {
            newRecvSync.call(this, sync);
            oldRecvSync.call(this, sync);
          };
       } else {
        console.warn("Detected a potentially unacceptable overwrite of " + i + 'on ' + this.getId());
      }
    }
  }
};

Entity.prototype.doLogic = function() {
	this.raiseEvent('tick', {});
};

Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};

Entity.prototype.getSync = function() {
  var sync = {};
  this.updateSync(sync);
  return sync;
};

Entity.prototype.is = function(component) {
  for(var x = 0; x < this.components.length; x++) {
    if(this.components[x] === component) return true;
  }
  return false;
};

Entity.prototype.updateSync = function(sync) {

};

Entity.prototype.setSync = function(sync) {

};

Entity.prototype.render = function(context){
    if(!this._model) { return; }
	var gl = context.gl;

	var viewMatrix = this._scene.camera.getViewMatrix();
	var projectionMatrix = this._scene.camera.getProjectionMatrix();
    
	var worldMatrix = mat4.create();
    mat4.identity(worldMatrix);
    mat4.translate(worldMatrix, this.position);
    mat4.rotateY(worldMatrix, this.rotationY);
    
    var modelViewMatrix = mat4.create();
    mat4.multiply(viewMatrix, worldMatrix, modelViewMatrix);
    
    var normalMatrix = mat3.create();
    mat3.identity(normalMatrix);
    mat4.toInverseMat3(modelViewMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
    
	  var program = context.setActiveProgram(this._model.getProgram());
      
	  this._model.upload(context);

	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
    gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);

	this._model.render(context);
};

exports.Entity = Entity;
