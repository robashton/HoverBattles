ClientGameReceiver = function(app, server) {
  this.app = app;
  this.server = server;
  this.started = false;
  this.craft = null;
  this.playerId = null;
  this.chaseCamera = null;
  this.hovercraftFactory = new HovercraftFactory(app);
};

ClientGameReceiver.prototype.attachEmitterToCraft = function(craft) {
    var emitter = new ParticleEmitter(craft.getId() + 'trail', 1000, this.app,
    {
        maxsize: 130,
        maxlifetime: 0.2,
        rate: 50,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        track: function(){
            this.position = vec3.create(craft.position);
        }
    });
    craft.emitter = emitter;
    this.app.scene.addEntity(emitter);
};

ClientGameReceiver.prototype.removeCraftEmitter = function(craft) {
    this.app.scene.removeEntity(craft.emitter);
};

ClientGameReceiver.prototype._init = function(data) {
	this.playerId = data.id;
    this.craft = this.hovercraftFactory.create(data.id);   
    this.controller = new HovercraftController(data.id, this.server);
	  this.craft.attach(Smoother);
    this.craft.player = true;

    this.chaseCamera = new Entity("chaseCameraController");
    this.chaseCamera.attach(ChaseCamera);
    this.chaseCamera.setTrackedEntity(this.craft);
    this.app.scene.addEntity(this.chaseCamera);

	this.server.sendMessage('ready');
};

ClientGameReceiver.prototype._syncscene = function(data) {

	for(i in data.craft) {
		var serverCraft = data.craft[i];
		
		var clientCraft = 
		serverCraft.id === this.playerId 
					? this.craft
					: this.app.scene.getEntity(serverCraft.id);

		if(!clientCraft) {
    		clientCraft = this.addHovercraftToScene(serverCraft.id, serverCraft.sync);
		}
		clientCraft.setSync(serverCraft.sync);		
	}

	if(!this.started) {
		this.started = true;
		this.app.scene.addEntity(this.craft);
		this.attachEmitterToCraft(this.craft);
	}
};

ClientGameReceiver.prototype._reviveTarget = function(data) {
	if(data.id === this.craft.getId()) {

		// Re-add entity to scene
		this.app.scene.addEntity(this.craft);
		this.app.scene.addEntity(this.craft.emitter);
		this.craft.setSync(data.sync);

		// Tell the camera to start zooming back into the re-animated craft
		this.chaseCamera.startZoomingBackInChaseCamera();

		// Re-hook input
	}
	else {

		// Re-add entity to scene
		this.addHovercraftToScene(data.id, data.sync);
	}
};

ClientGameReceiver.prototype._destroyTarget = function(data) {
	var target = this.app.scene.getEntity(data.targetid);
	if(this.craft === target) {

		// Remove entity from scene
		this.app.scene.removeEntity(this.craft);
		this.app.scene.removeEntity(this.craft.emitter);

		// Cause explosion

		// Tell the camera to start zooming out
		this.chaseCamera.startZoomingOutChaseCamera();

		// Unhook input
		
	}
	else {

		// Remove entity from scene
		this.removeHovercraftFromScene(data.targetid);

		// Cause explosion
	}	
};

ClientGameReceiver.prototype._addplayer = function(data) {
	this.addHovercraftToScene(data.id, data.sync);
};

ClientGameReceiver.prototype._removeplayer = function(data) {
    this.removeHovercraftFromScene(data.id);
};

ClientGameReceiver.prototype.removeHovercraftFromScene = function(id) {
    var craft = this.app.scene.getEntity(id);
    this.removeCraftEmitter(craft);
    this.app.scene.removeEntity(craft);
};

ClientGameReceiver.prototype.addHovercraftToScene = function(id, sync) {
    var craft = this.hovercraftFactory.create(id);
	craft.attach(Smoother);
    craft.setSync(sync);
    this.app.scene.addEntity(craft);
    this.attachEmitterToCraft(craft);
	return craft;
};

ClientGameReceiver.prototype._sync = function(data) {
    var entity = this.app.scene.getEntity(data.id);

	if(!entity) {
		console.log('Message received to sync entity that does not exist: ' + data.id);
		return;
	}
    entity.setSync(data.sync);
};


exports.ClientGameReceiver = ClientGameReceiver;
