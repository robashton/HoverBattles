var Explosion = require('../entities/explosion').Explosion;
var MissileFirer = require('../entities/missilefirer').MissileFirer;
var MissileFactory = require('../entities/missilefactory').MissileFactory;
var HovercraftSpawner = require('../entities/hovercraftspawner').HovercraftSpawner;
var HovercraftFactory = require('../entities/hovercraftfactory').HovercraftFactory;
var ScoreKeeper = require('../entities/scorekeeper').ScoreKeeper;
var ChaseCamera = require('../entities/chasecamera').ChaseCamera;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var TrailsAndExplosions = require('./trailsandexplosions').TrailsAndExplosions;
var ScoreDisplay = require('./scoredisplay').ScoreDisplay;
var Hud = require('./hud').Hud;
var Floor = require('./floor').Floor;
var PlayerMessageListener = require('./playermessagelistener').PlayerMessageListener;
var ChatDisplay = require('./chatdisplay').ChatDisplay;

exports.ClientGameReceiver = function(app, server) {
  var self = this;

  var app = app;
  var server = server;

  var playerId = null;
  var chaseCamera = null;
  var controller = null;
  var spawner = HovercraftSpawner.Create(app.scene);
  var hovercraftFactory = new HovercraftFactory(app);
  var scoreKeeper = ScoreKeeper.Create(app.scene);
  var scoreDisplay = new ScoreDisplay(app.scene);

  var missileFirer = null;
  var trailsAndExplosions = null;
  var hud = null;
  var floor = null;
  var chatDisplay = null;
  
  var playerMessageListener = new PlayerMessageListener(app);

  self._init = function(data) {
	  playerId = data.id;
    createGameComponents();
    initializeHud();
    waitForAssetsToLoad();   
  }; 
  
  var createGameComponents = function() {
    missileFirer = new MissileFirer(app, new MissileFactory());
    trailsAndExplosions = new TrailsAndExplosions(app);
    floor = Floor.Create(app);
    chaseCamera = ChaseCamera.Create(app.scene, playerId);
    controller = new HovercraftController(playerId, server);
    scoreDisplay.setPlayerId(playerId);
    playerMessageListener.setPlayerId(playerId);
    chatDisplay = new ChatDisplay(server, app.scene, playerId, controller);    
  };

  var initializeHud = function() {
    hud = Hud.create(app);
    hud.setPlayerId(playerId);
    hud.disable();
  };

  var waitForAssetsToLoad = function() {
	  app.resources.onAllAssetsLoaded(function() {
      sendReadyWithCredentialsToServer();
      hud.enable();
    });
  };

  var sendReadyWithCredentialsToServer = function() {
    var username = $.cookie('username');
    var sign = $.cookie('sign');

    server.sendMessage('ready', {
      username: username,
      sign: sign
    });
  };
  
  self._addchatmessage = function(data) {
    chatDisplay.receiveMessageFromServer(data);
  };

  self._noauth = function(data) {
     document.location = 'login.html'; 
  };

  self._syncscene = function(data) {

    // Note: To casual readers, this is NOT how regular syncing works in this application
    // This will get called at least 'once' when the game first fires up, and then when something really
    // major happens on the server. It's a "belt and braces" sync where all entities get all their state effectively
    // refreshed - the real sync is below (and you'll notice that we don't just accept the server values as is, we
    // do rubber banding around the values provided
    // Also, for the most part we rely on event-forwarding to keep state in sync, multiple models all receiving the same input
    // == multiple (mostly) identical models
    for(i in data.others) {
      var serverEntity = data.others[i];
      var clientEntity = app.scene.getEntity(serverEntity.id);

      if(clientEntity)
        clientEntity.setSync(serverEntity.sync);
    }
	  for(i in data.craft) {
		  var serverCraft = data.craft[i];		
		  var clientCraft = app.scene.getEntity(serverCraft.id);

		  if(!clientCraft)
      	 addHovercraftToScene(serverCraft.id, serverCraft.sync);
		  else 
        clientCraft.setSync(serverCraft.sync);      
	  }
    app.scene.broadcastEvent(app.scene, 'fullSyncCompleted', {});
  };

  self._sync = function(data) {
    app.scene.withEntity(data.id, function(entity) {
        entity.setSync(data.sync);
    });
  };

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
	    return craftToAdd;
  };
};

