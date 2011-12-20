var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var Camera = require('./camera').Camera;
var CollisionManager = require('./collisionmanager').CollisionManager;
var EventContainer = require('./eventcontainer').EventContainer;

var Scene = function(app){
  this._entities = {};
  this.app = app;
  this.camera = new Camera();
  this.collisionManager = new CollisionManager();
  this.entityAddedListeners = new EventContainer();
  this.entityRemovedListeners = new EventContainer();
  this.entityEventListeners = {};
};

Scene.prototype.onEntityAdded = function(callback) {
  this.entityAddedListeners.add(callback);
};

Scene.prototype.onEntityRemoved = function(callback) {
  this.entityRemovedListeners.add(callback);
};

Scene.prototype.raiseEntityAdded = function(entity) {
  if(!(entity instanceof Entity)) return; // Hack to get around non-entity based entities (legacy)
  this.entityAddedListeners.raise(this, entity);
};

Scene.prototype.raiseEntityRemoved = function(entity) {
  if(!(entity instanceof Entity)) return; // Hack to get around non-entity based entities (legacy)
  this.entityRemovedListeners.raise(this, entity);
};

Scene.prototype.withEntity = function(id, callback) {
  var entity = this.getEntity(id);
  if(entity) {
    callback(entity);
  } else { console.log('Failed to find entity ' + id); }
};

Scene.prototype.getEntity = function(id) {
  return this._entities[id];  
};

Scene.prototype.addEntity = function(entity){
  this._entities[entity.getId()] = entity;
  entity.setScene(this);
  this.raiseEntityAdded(entity);
};

Scene.prototype.removeEntity = function(entity) {
  this.raiseEntityRemoved(entity);
	entity.setScene(undefined);
	delete this._entities[entity.getId()];
};

Scene.prototype.doLogic = function() {
    for(i in this._entities){ 
      this._entities[i].doLogic();
    }
    
    for(var i in this._entities){ 
      for(var j in this._entities){ 
        if(i === j) continue;
        
        // Note: I know this is sub-optimal
        // When it becomes an issue I'll go all DoD on its ass
        // But not until then
        var entityOne = this._entities[i];
        var entityTwo = this._entities[j];
        this.collisionManager.processPair(entityOne, entityTwo);            
      }
    }
};

Scene.prototype.forEachEntity = function(callback) {
  for(var i in this._entities)
    if(callback(this._entities[i]) === false)
      return;
};

Scene.prototype.broadcastEvent = function(source, eventName, data) {
  var container = this.entityEventListeners[eventName];
  if(container)
    container.raise(source, data);
};

Scene.prototype.eventContainerFor = function(eventName) {
  var container = this.entityEventListeners[eventName];
  if(!container) {
    container =  new EventContainer();
    this.entityEventListeners[eventName] = container;
  }
  return container;
};

Scene.prototype.on = function(eventName, callback) {
  this.eventContainerFor(eventName).add(callback);
};

Scene.prototype.off = function(eventName, callback) {
  this.eventContainerFor(eventName).remove(callback);
};

Scene.prototype.render = function(context){
  var gl = context.gl;
  
  this.camera.width = context.canvasWidth();
  this.camera.height = context.canvasHeight();
  this.camera.updateMatrices();

  for(var i in this._entities) {
	  var entity = this._entities[i];
        
    if(entity.getSphere){
      if(!this.camera.frustum.intersectSphere(entity.getSphere())){
        continue;
      }
    }      
	  entity.render(context);
  }       
};

exports.Scene = Scene;
