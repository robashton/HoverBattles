var Explosion = require('../explosion').Explosion;
var MissileFirer = require('../missilefirer').MissileFirer;
var MissileFactory = require('../missilefactory').MissileFactory;
var TrailsAndExplosions = require('../trailsandexplosions').TrailsAndExplosions;

exports.ClientGameReceiver = function(app, server) {
  var self = this;

  var app = app;
  var server = server;
  var started = false;
  var craft = null;
  var allCraft = {};
  var playerId = null;
  var chaseCamera = null;
  var controller = null;
  var hovercraftFactory = new HovercraftFactory(app);

  var missileFirer = new MissileFirer(app, new MissileFactory());
  var trailsAndExplosions = new TrailsAndExplosions(app);
 
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

    // Wait till we're actually ready before telling the server we are
	  app.resources.onAllAssetsLoaded(function() {
      
      var username = $.cookie('username');
      var sign = $.cookie('sign');

      server.sendMessage('ready', {
        username: username,
        sign: sign
      });    

    });
  };

  self._noauth = function(data) {
     document.location = 'login.html'; 
  };

  self._destroyTarget = function(data) {

	  if(craft.getId() === data.targetid) {    

      // Remove entity from scene
		  app.scene.removeEntity(craft);
      app.scene.withEntity(data.sourceid, function(source) {

        // Set up the camera to do the zooming out thing
        chaseCamera.setMovementDelta(0.03);
        chaseCamera.setLookAtDelta(0.03);
        chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 100, craft.position[1]]);

        setTimeout(function() {
          chaseCamera.setTrackedEntity(source);
        }, 1500);        

        setTimeout(function() {
            chaseCamera.fixLocationAt([craft.position[0], craft.position[1] + 300, craft.position[1]]);
        }, 5000);
      });

      // Disable input
		  controller.disable();   
		
	  }
	  else {
		  removeHovercraftFromScene(data.targetid);
	  }	
  };

  self._reviveTarget = function(data) {
	  if(data.id === craft.getId()) {

		  // Re-add entity to scene
		  app.scene.addEntity(craft);
		  craft.setSync(data.sync);

      // Reset camera
      chaseCamera.resetDeltas();
		  chaseCamera.setTrackedEntity(craft);
      chaseCamera.unfixLocation();

      // Re-add input control
		  controller.enable();
	  }
	  else {
      var revivedCraft = allCraft[data.id];
      app.scene.addEntity(revivedCraft);
       revivedCraft.setSync(data.sync);
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

  var terrain = app.scene.getEntity('terrain');
  self._updateplayer = function(data) {
    var entity = app.scene.getEntity(data.id);
    if(!entity)
	    addHovercraftToScene(data.id, data.sync);
    else
      entity.setSync(data.sync);
  };

  self._removeplayer = function(data) {
      delete allCraft[data.id];
      removeHovercraftFromScene(data.id);
  };

  var removeHovercraftFromScene = function(id) {
      app.scene.withEntity(id, function(craftToRemove) {
        app.scene.removeEntity(craftToRemove);
      });
  };

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
	    craftToAdd.attach(Smoother);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
      allCraft[id] = craftToAdd;
	    return craftToAdd;
  };
};

