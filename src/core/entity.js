var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var mat3 = require('../thirdparty/glmatrix').mat3;

var Entity = function(id){
  var self = this;
  self._model = null;
	self._id = id;
	self.position = vec3.create([0,0,0]);
  self.rotationY = 0;
	self._scene = null;
	self.eventHandlers = {};
  self.components = [];

  var eventQueue = [];
  var eventCount = 0;

  self.getId = function(){
	  return self._id;
  };

  self.setModel = function(model) {
     self._model = model;  
  };

  self.getModel = function(){
	  return self._model;
  };

  self.addEventHandler = function(eventName, callback) {
	  if(!self.eventHandlers[eventName])
		  self.eventHandlers[eventName] = [];
	  self.eventHandlers[eventName].push(callback);
  };

  self.removeEventHandler = function(eventName, callback) {
	  if(!self.eventHandlers[eventName])
		  self.eventHandlers[eventName] = [];

    var newItems = [];
    for(var i = 0; i < self.eventHandlers[eventName].length; i++)
        if(self.eventHandlers[eventName][i] !== callback) 
          newItems.push(self.eventHandlers[eventName][i]);
    
    self.eventHandlers[eventName] = newItems;
  };

  self.raiseServerEvent = function(eventName, data) {
	  if(self._scene.app.isClient) return;
    self.raiseEvent(eventName, data);
  };

  self.raiseEvent = function(eventName, data) {
    eventQueue.push({
      name: eventName,
      data: data
    });

   eventCount++;
   sendEventToInternalListeners(eventName, data);
   eventCount--;
   
   // Ensure that events are published in the order that we processed them internally
   if(eventCount === 0) {
      var queue = eventQueue;
      eventQueue = [];
      publishEventQueue(queue);
   }
  };

  var publishEventQueue = function(queue) {
    for(var i = 0; i < queue.length; i++)
      self._scene.broadcastEvent(self, queue[i].name, queue[i].data);
  };

  var sendEventToInternalListeners = function(eventName, data) {
	  if(!self.eventHandlers[eventName]) return;
	  for(var x = 0 ; x < self.eventHandlers[eventName].length; x++){
		  var handler = self.eventHandlers[eventName][x];
		  handler.call(self, data);
	  }
  };  

  self.attach = function(component, args) {
    self.components.push(component);

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
            self.doLogic = function() {
              oldLogic.call(this);
              newLogic.call(this);
            }
         }
         else if(i === 'updateSync') {
            var newSendSync = this[i];
            var oldSendSync = oldProperties[i];
            self.updateSync = function(sync) {
              newSendSync.call(this, sync);
              oldSendSync.call(this, sync);
            };
         }
         else if(i === 'setSync') {
            var newRecvSync = this[i];
            var oldRecvSync = oldProperties[i];
            self.setSync = function(sync) {
              newRecvSync.call(this, sync);
              oldRecvSync.call(this, sync);
            };
         } 
        else if(i === 'render') {
          // ignore
        }
        else {
          console.warn("Detected a potentially unacceptable overwrite of " + i + 'on ' + this.getId());
        }
      }
    }
  };

  self.sendMessage = function(msg, data) {
    var functionName = msg;
    if(this[functionName])
      this[functionName](data);
  };

  self.doLogic = function() {

  };

  self.setScene = function(scene) {
	  self._scene = scene;
  };

  self.getSync = function() {
    var sync = {};
    self.updateSync(sync);
    return sync;
  };

  self.is = function(component) {
    for(var x = 0; x < self.components.length; x++) {
      // Hack: To get around stitch and its dodgy caching
      if(self.components[x].toString() === component.toString()) return true;
    }
    return false;
  };

  self.updateSync = function(sync) {

  };

  self.setSync = function(sync) {

  };

  self.render = function(context){
    if(!self._model) { return; }
	  var gl = context.gl;

	  var viewMatrix = self._scene.camera.getViewMatrix();
	  var projectionMatrix = self._scene.camera.getProjectionMatrix();
      
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
      
	    var program = context.setActiveProgram(self._model.getProgram());
        
	    self._model.upload(context);

	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
	    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
      gl.uniformMatrix3fv(gl.getUniformLocation(program, "uNormalMatrix"), false, normalMatrix);

	    self._model.render(context);
  };
};

exports.Entity = Entity;
