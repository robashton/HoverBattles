var Entity = require('../core/entity').Entity;
var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;
var Hovercraft = require('./hovercraft').Hovercraft;

exports.HovercraftSpawner = function(scene) {
  var self = this;  
  var hovercraftFactory = new HovercraftFactory(scene.app);
  var playerNames = {};

  scene.addEntity(self);

  self.createPlayer = function(id) {
    self.raiseServerEvent('playerJoined', {
      id: id
    });
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

  self.removePlayer = function(id) {
    var craft = scene.getEntity(id);
    if(!craft) return;
    self.raiseServerEvent('playerLeft', {
      id: id
    });
  };

  self.namePlayer = function(id, name) {
    self.raiseServerEvent('playerNamed', {
      id: id,
      name: name
    });
  };

  self.setSync = function(sync) {
    playerNames = sync.playerNames;
    updateAllPlayerNames();
  };

  self.updateSync = function(sync) {
    sync.playerNames = playerNames;
  };
  
  var onEntityAddedToScene = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.displayName(playerNames[entity.getId()]);
  };

  var updateAllPlayerNames = function() {
    for(var playerId in playerNames)
      scene.withEntity(playerId, function(entity) {
        entity.displayName(playerNames[playerId]);
      });
  };

  var onEntityDestroyed = function() {
    var id = this.getId();
    scene.removeEntity(this);

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

  var onPlayerLeft = function(data) {
    var craft = scene.getEntity(data.id);
    scene.removeEntity(craft);
  };

  var onEntitySpawned = function(data) {
    var craft = hovercraftFactory.create(data.id);   
	  craft.position = data.position;
    scene.addEntity(craft);
  };

  var onPlayerNamed = function(data) {
    playerNames[data.id] = data.name;
  };

  var onPlayerJoined = function(data) {
    self.spawnHovercraft(data.id);
  };

  scene.on('entityDestroyed', onEntityDestroyed);
  scene.onEntityAdded(onEntityAddedToScene);

  self.addEventHandler('playerNamed', onPlayerNamed);
  self.addEventHandler('entityRevived', onEntityRevived);
  self.addEventHandler('playerLeft', onPlayerLeft);
  self.addEventHandler('playerJoined', onPlayerJoined);
  self.addEventHandler('entitySpawned', onEntitySpawned);
};

exports.HovercraftSpawner.Create = function(scene) {
  var entity = new Entity('hovercraft-spawner');
  entity.attach(exports.HovercraftSpawner, [scene]);
  return entity;
};
