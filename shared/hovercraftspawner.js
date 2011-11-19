var Entity = require('./entity').Entity;
var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;

exports.HovercraftSpawner = function(scene) {
  Entity.call(this, 'hovercraft-spawner');

  var self = this;  
  var hovercraftFactory = new HovercraftFactory(scene.app);
  scene.addEntity(self);
  
  var onEntityAdded = function(entity) {
    if(entity.is(Hovercraft))
      entity.addEventHandler('entityDestroyed', onEntityDestroyed);
  };
  
  var onEntityRemoved = function(entity) {
    if(entity.is(Hovercraft))
      entity.removeEventHandler('entityDestroyed', onEntityDestroyed);
  };

  var onEntityDestroyed = function() {
    var id = this.getId();
    setTimeout(function() {
      raiseEntityRevived(id);
    }, 10000);
  };
  var raiseEntityRevived = function(id) {
    self.raiseServerEvent('entityRevived', { id: id });
  };

  var onEntityRevived = function(data) {
    self.spawnHovercraft(data.id);
  };  

  var onPlayerRemoved = function(data) {
    var craft = scene.getEntity(data.id);
    scene.removeEntity(craft);
  };

  var onEntitySpawned = function(data) {
    var craft = hovercraftFactory.create(data.id);   
	  craft.position = data.position;
    scene.addEntity(craft);
  };

  self.spawnHovercraft = function(id) {
    var position = vec3.create([
      Math.random() * 400 - 200,
       200,
      Math.random() * 400 - 200
    ]);

    self.raiseServerEvent('entitySpawned', {
      id: id,
      position: position
    });
  };

  self.removeHovercraft = function(id) {
    var craft = scene.getEntity(id);
    if(!craft) return;
    self.raiseServerEvent('playerRemoved', {
      id: id
    });
  };

  self._scene.onEntityAdded(onEntityAdded);
  self._scene.onEntityRemoved(onEntityRemoved);
  self.addEventHandler('entityRevived', onEntityRevived);
  self.addEventHandler('playerRemoved', onPlayerRemoved);
  self.addEventHandler('entitySpawned', onEntitySpawned);
};
