HovercraftFactory = require('../../shared/hovercraftfactory').HovercraftFactory;
MissileFactory = require('../../shared/missilefactory').MissileFactory;
MissileFirer = require('../../shared/missilefirer').MissileFirer;
Hovercraft = require('../../shared/hovercraft').Hovercraft;
Identity = require('../identity').Identity;
HovercraftSpawner = require('../../shared/hovercraftspawner').HovercraftSpawner;

exports.ServerGameReceiver = function(app, communication) {
  var self = this;
  var guestCount = 0;
  var missileFirer = new MissileFirer(app, new MissileFactory());
  var spawner = new HovercraftSpawner(app.scene);

  self.removePlayer = function(id) {
    spawner.removeHovercraft(id);
  };

  self.getSyncForPlayer = function(id) {
    var craft = app.scene.getEntity(id);
	  if(craft)
	    return craft.getSync();
    return null;
  };

  self.getSceneState = function() {
	  var state = {};
	  state.craft = [];
    app.scene.forEachEntity(function(entity) {
      if(!entity.is(Hovercraft)) return;
		  var craftState = {};
		  craftState.id = entity.getId();
		  craftState.sync = entity.getSync();
		  state.craft.push(craftState);   
    });
	  return state;	
  };  
  
  self._ready = function(data) {
    if(data.username) {
      if(!Identity.verifyUsername(data.username, data.sign)) {
        communication.rejectClient(data.source);
        return;
      }
    } else {
      data.username = 'guest-' + this.guestCount++;
    }; 

    spawner.spawnHovercraft(data.source);
    var craft = app.scene.getEntity(data.source);
    craft.displayName(data.username);

	  communication.syncPlayerFull(data.source);
    communication.sendMessage('updateplayer', {
      id:  data.source,
      sync: craft.getSync()
    });

    // Let everybody know about this id/username pair
    communication.sendMessage('playerNamed', {
      id: data.source,
      username: data.username
    });
  };

  self._fireRequest = function(data) {
    app.scene.withEntity(data.id, function(entity) {
      entity.tryFireMissile();
    });
  };
};
