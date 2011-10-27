var Explosion = require('../explosion').Explosion;

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

  self._destroyTarget = function(data) {

	  if(craft.getId() === data.targetid) {    
      createExplosionForCraftWithId(data.targetid);

      // Remove entity from scene
		  app.scene.removeEntity(craft);
		  app.scene.removeEntity(craft.emitter);

      app.scene.withEntity(data.sourceid, function(source) {

        // Set up the camera to do the zooming out thing
        chaseCamera.setMovementDelta(0.03);
        chaseCamera.setLookAtDelta(0.03);
        chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 100, craft.position[1]]);

        setTimeout(function() {
            chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 300, craft.position[1]]);
            chaseCamera.setTrackedEntity(source);
        }, 5000);
      });

      // Disable input
		  controller.disable();   
		
	  }
	  else {
      createExplosionForCraftWithId(data.targetid);
		  removeHovercraftFromScene(data.targetid);
	  }	
  };

    self._reviveTarget = function(data) {
	  if(data.id === craft.getId()) {

		  // Re-add entity to scene
		  app.scene.addEntity(craft);
		  app.scene.addEntity(craft.emitter);
		  craft.setSync(data.sync);

      // Reset camera
      chaseCamera.setMovementDelta(0.1);
      chaseCamera.setLookAtDelta(0.7);
		  chaseCamera.setTrackedEntity(craft);
      chaseCamera.unfixLocation();

      // Re-add input control
		  controller.enable();
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

  self._sync = function(data) {
      var entity = app.scene.getEntity(data.id);

	  if(!entity) {
		  console.log('Message received to sync entity that does not exist: ' + data.id);
		  return;
	  }
      entity.setSync(data.sync);
  };
  
  createExplosionForCraftWithId = function(craftId) {
    app.scene.withEntity(craftId, function(explodingCraft) {
      var explosion = new Explosion(app, {
        position: explodingCraft.position,
        initialVelocity: explodingCraft._velocity        
      });
    });
  };

  var removeCraftEmitter = function(craft) {
    app.scene.removeEntity(craft.emitter);
  };  

  var attachEmitterToCraft = function(craft) {
    var emitter = new ParticleEmitter(craft.getId() + 'trail', 1000, app,
    {
        maxsize: 40,
        maxlifetime: 0.2,
        rate: 50,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        particleVelocity: vec3.create([0.1, -0.3, 0.1]),
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

