exports.ClientGameReceiver = function(app, server) {
  var self = this;

  var app = app;
  var server = server;
  var started = false;
  var craft = null;
  var playerId = null;
  var chaseCamera = null;
  var controller = null;
  var hovercraftFactory = new HovercraftFactory(app);
  

  self._init = function(data) {
	  playerId = data.id;
    craft = hovercraftFactory.create(data.id);   
    controller = new HovercraftController(data.id, server);
	  craft.attach(Smoother);
    craft.player = true;

    chaseCamera = new Entity("chaseCameraController");
    chaseCamera.attach(ChaseCamera);
    chaseCamera.setTrackedEntity(craft);
    app.scene.addEntity(chaseCamera);

	  server.sendMessage('ready');
  };

    self._reviveTarget = function(data) {
	  if(data.id === craft.getId()) {

		  // Re-add entity to scene
		  app.scene.addEntity(craft);
		  app.scene.addEntity(craft.emitter);
		  craft.setSync(data.sync);

		  // Tell the camera to start zooming back into the re-animated craft
		  chaseCamera.startZoomingBackInChaseCamera();

		  // Re-hook input
	  }
	  else {

		  // Re-add entity to scene
		  addHovercraftToScene(data.id, data.sync);
	  }
  };  
  

  self._syncscene = function(data) {

	  for(i in data.craft) {
		  var serverCraft = data.craft[i];
		
		  var clientCraft = 
		  serverCraft.id === playerId 
					  ? craft
					  : app.scene.getEntity(serverCraft.id);

		  if(!clientCraft) {
      		clientCraft = addHovercraftToScene(serverCraft.id, serverCraft.sync);
		  }
		  clientCraft.setSync(serverCraft.sync);		
	  }

	  if(!started) {
		  started = true;
		  app.scene.addEntity(craft);
		  attachEmitterToCraft(craft);
	  }
  };

  self._destroyTarget = function(data) {

	  if(craft.getId() === data.targetid) {

		  // Remove entity from scene
		  app.scene.removeEntity(craft);
		  app.scene.removeEntity(craft.emitter);

		  // Cause explosion
      

		  // Tell the camera to start zooming out
		  chaseCamera.startZoomingOutChaseCamera();

		  // Unhook input
		
	  }
	  else {

		  // Remove entity from scene
		  removeHovercraftFromScene(data.targetid);

		  // Cause explosion
	  }	
  };

  self._sync = function(data) {
      var entity = app.scene.getEntity(data.id);

	  if(!entity) {
		  console.log('Message received to sync entity that does not exist: ' + data.id);
		  return;
	  }
      entity.setSync(data.sync);
  };
   

  var removeCraftEmitter = function(craft) {
    app.scene.removeEntity(craft.emitter);
  };
  

  var attachEmitterToCraft = function(craft) {
    var emitter = new ParticleEmitter(craft.getId() + 'trail', 1000, app,
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
    app.scene.addEntity(emitter);
   };

  self._addplayer = function(data) {
	  addHovercraftToScene(data.id, data.sync);
  };

  self._removeplayer = function(data) {
      removeHovercraftFromScene(data.id);
  };

  var removeHovercraftFromScene = function(id) {
      app.scene.withEntity(id, function(craftToRemove) {
        removeCraftEmitter(craftToRemove);
        app.scene.removeEntity(craftToRemove);
      });
  };

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
	    craftToAdd.attach(Smoother);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
      attachEmitterToCraft(craftToAdd);
	    return craftToAdd;
  };
};

