HovercraftFactory = require('../../shared/hovercraftfactory').HovercraftFactory;
MissileFactory = require('../../shared/missilefactory').MissileFactory;
FiringController = require('../FiringController').FiringController;
Hovercraft = require('../../shared/hovercraft').Hovercraft;
Identity = require('../identity').Identity;

ServerGameReceiver = function(app, communication) {
	this.app = app;
	this.communication = communication;
	this.hovercraftFactory = new HovercraftFactory(this.app);
	this.craft = {};
  this.guestCount = 0;
};

ServerGameReceiver.prototype.addPlayer = function(id) {
	var newCraft = this.hovercraftFactory.create(id);
	newCraft._firingController = new FiringController(newCraft, this.communication);
	this.craft[id] = newCraft;
};

ServerGameReceiver.prototype.removePlayer = function(id) {
	if(this.craft[id]) {
		this.app.scene.removeEntity(this.craft[id])
     delete this.craft[id];
  } else {
    console.log('Attempted to remove non-existent player from craft collection: ' + id);  
  }
};

ServerGameReceiver.prototype.getSyncForPlayer = function(id) {
  var craft = this.app.scene.getEntity(id);
	if(craft)
	  return craft.getSync();
  return null;
};

ServerGameReceiver.prototype.getSceneState = function() {
	var state = {};
	state.craft = [];
  this.app.scene.forEachEntity(function(entity) {
    if(!entity.is(Hovercraft)) return;
		var craftState = {};
		craftState.id = entity.getId();
		craftState.sync = entity.getSync();
		state.craft.push(craftState);   
  });
	return state;	
};

ServerGameReceiver.prototype._fireRequest = function(data) {
  var craft = this.craft[data.source];
  if(!craft) {
    console.warn('Fire request received for craft that does not exist');
    return;
  }
  craft._firingController.tryFireMissile();
};

ServerGameReceiver.prototype._ready = function( data) {
  var craft = this.craft[data.source];

  if(data.username) {
    // This is effectively a verification of authentication for this socket
    if(!Identity.verifyUsername(data.username, data.sign)) {
      this.communication.rejectClient(data.source);
      return;
    }
  } else {
    data.username = 'guest-' + this.guestCount++;
  };

  // Then we can create the craft we desire
  this.spawnCraft(craft);
	this.communication.syncPlayerFull(craft.getId());
  this.communication.sendMessage('updateplayer', {
    id: craft.getId(),
    sync: craft.getSync()
  });

  // Let everybody know about this id/username pair
  this.communication.sendMessage('playerNamed', {
    id: craft.getId(),
    username: data.username
  });
};

ServerGameReceiver.prototype.spawnCraft = function(craft) {
  craft.position[0] = Math.random() * 400 - 200;
  craft.position[1] = 100;
  craft.position[2] = Math.random() * 400 - 200;
  craft.reset();
  this.app.scene.addEntity(craft);
};

ServerGameReceiver.prototype._reviveTarget = function() {}; 
ServerGameReceiver.prototype._destroyTarget = function(data) {
  var self = this;
  
  // Clear up the appropriate fire controler
  self.app.scene.withEntity(data.sourceid, function(source) {
    source._firingController.reset();
  });

	// Remove the entity from our scene
	var craft = this.app.scene.getEntity(data.targetid);
	this.app.scene.removeEntity(craft);

	// And wait until an appropriate moment to revive it
	setTimeout(function() {
    if(!self.craft[craft.getId()]) return;

		// Re-add the craft on our side
    self.spawnCraft(craft);

    var sync = craft.getSync()
    sync.force = true;

		// And tell everyone else to do likewise
		self.communication.sendMessage('reviveTarget', { 
			id: craft.getId(),
      sync: sync
		});		
		
	}, 10000);	
};


exports.ServerGameReceiver = ServerGameReceiver;
