HovercraftFactory = require('../../shared/hovercraftfactory').HovercraftFactory;
MissileFactory = require('../../shared/missilefactory').MissileFactory;
FiringController = require('../FiringController').FiringController;

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
	if(this.craft[id])
		this.app.scene.removeEntity(this.craft[id]);
};

ServerGameReceiver.prototype.getSyncForPlayer = function(id) {
	var craft = this.craft[id];
	return craft.getSync();
};

ServerGameReceiver.prototype.getSceneState = function() {
	var state = {};
	state.craft = [];
	for(i in this.craft) {
		var craft = this.craft[i];
		var craftState = {};
		craftState.id = craft.getId();
		craftState.sync = craft.getSync();
		state.craft.push(craftState);
	};
	return state;	
};

ServerGameReceiver.prototype._ready = function( data) {
	this.communication.syncPlayerFull(data.source);
};

ServerGameReceiver.prototype._destroyTarget = function(data) {

	// Remove the entity from our scene
	var craft = this.app.scene.getEntity(data.targetid);
	this.app.scene.removeEntity(craft);
	var self = this;
	var sync = craft.getSync();

	// And wait until an appropriate moment to revive it
	setTimeout(function() {

		// Re-add the craft on our side
		this.app.scene.addEntity(craft);

		// And tell everyone else to do likewise
		self.communication.sendMessage('reviveTarget', { 
			id: this.entity.getId(),
			sync: sync
		});
		
		
	}, 5000);	
};


exports.ServerGameReceiver = ServerGameReceiver;
