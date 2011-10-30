HovercraftFactory = require('../../shared/hovercraftfactory').HovercraftFactory;
MissileFactory = require('../../shared/missilefactory').MissileFactory;
FiringController = require('../FiringController').FiringController;
Hovercraft = require('../../shared/hovercraft').Hovercraft;

ServerGameReceiver = function(app, communication) {
	this.app = app;
	this.communication = communication;
	this.hovercraftFactory = new HovercraftFactory(this.app);
	this.craft = {};
};

ServerGameReceiver.prototype.addPlayer = function(id) {
	var newCraft = this.hovercraftFactory.create(id);
	newCraft._firingController = new FiringController(newCraft, this.communication);
	this.craft[id] = newCraft;
	this.app.scene.addEntity(newCraft);
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
	this.communication.syncPlayerFull(data.source);
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
	var sync = craft.getSync();

	// And wait until an appropriate moment to revive it
	setTimeout(function() {
    if(!self.craft[craft.getId()]) return;

		// Re-add the craft on our side
		self.app.scene.addEntity(craft);

		// And tell everyone else to do likewise
		self.communication.sendMessage('reviveTarget', { 
			id: craft.getId(),
			sync: sync
		});		
		
	}, 10000);	
};


exports.ServerGameReceiver = ServerGameReceiver;
