var Entity = require('./entity').Entity;
var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;

exports.HovercraftSpawner = function(scene) {
  var self = this;  
  var hovercraftFactory = new HovercraftFactory(scene.app);
  var playerNames = {};

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
    craft.displayName(playerNames[data.id]);
    scene.addEntity(craft);
  };

  var onPlayerNamed = function(data) {
    playerNames[data.id] = data.name;
    console.log(data.id + ' ' + data.name);
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

  self.namePlayer = function(id, name) {
    self.raiseServerEvent('playerNamed', {
      id: id,
      name: name
    });
  };

  self._scene.onEntityAdded(onEntityAdded);
  self._scene.onEntityRemoved(onEntityRemoved);

  self.addEventHandler('playerNamed', onPlayerNamed);
  self.addEventHandler('entityRevived', onEntityRevived);
  self.addEventHandler('playerRemoved', onPlayerRemoved);
  self.addEventHandler('entitySpawned', onEntitySpawned);
};

exports.HovercraftSpawner.Create = function(scene) {
  var entity = new Entity('hovercraft-spawner');
  entity.attach(exports.HovercraftSpawner, [scene]);
  return entity;
};
