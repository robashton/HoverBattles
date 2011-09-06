var MissileController = function(app, missileFactory) {
	this.app = app;
};

MissileController.prototype.fireMissile = function(sourceId, targetId) {
	// Create a missile with these parameters
	
	// Attach it to the scene
	
	// Tell it to go
	console.log('Firing a goddamned missile from ' + sourceId + ' to ' + targetId);
	
};

MissileController.prototype.cancelMissile = function(missileId) {
	// Find the missile
	
	// Terminate it
	
	// Remove it from the scene
};

exports.MissileController = MissileController;