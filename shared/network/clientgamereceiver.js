var Explosion = require('../explosion').Explosion;
var MissileFirer = require('../missilefirer').MissileFirer;
var MissileFactory = require('../missilefactory').MissileFactory;
var TrailsAndExplosions = require('../trailsandexplosions').TrailsAndExplosions;
var HovercraftSpawner = require('../hovercraftspawner').HovercraftSpawner;
var HovercraftFactory = require('../hovercraftfactory').HovercraftFactory;
var ScoreKeeper = require('../scorekeeper').ScoreKeeper;
var ScoreDisplay = require('./scoredisplay').ScoreDisplay;

var Hud = require('../hud').Hud;

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
  var spawner = HovercraftSpawner.Create(app.scene);
  var hovercraftFactory = new HovercraftFactory(app);
  var scoreKeeper = ScoreKeeper.Create(app.scene);
  var scoreDisplay = new ScoreDisplay(app.scene);

  var missileFirer = null;
  var trailsAndExplosions = null;
 
  self._init = function(data) {
	  playerId = data.id;

    createGameComponents();
    initializeHud();
    waitForAssetsToLoad();   
  };
  
  var createGameComponents = function() {
    missileFirer = new MissileFirer(app, new MissileFactory());
    trailsAndExplosions = new TrailsAndExplosions(app);
    chaseCamera = ChaseCamera.Create(app.scene, playerId);
    controller = new HovercraftController(playerId, server);
  };
 
  var initializeHud = function() {
    app.scene.withEntity(Hud.ID, function(hud) {
        hud.setPlayerId(playerId);
      });
  };

  var waitForAssetsToLoad = function() {
	  app.resources.onAllAssetsLoaded(function() {
      sendReadyWithCredentialsToServer();
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

  self._noauth = function(data) {
     document.location = 'login.html'; 
  };

  self._syncscene = function(data) {

	  for(i in data.craft) {
		  var serverCraft = data.craft[i];		
		  var clientCraft = app.scene.getEntity(serverCraft.id);

		  if(!clientCraft)
      	 addHovercraftToScene(serverCraft.id, serverCraft.sync);
		  else 
        clientCraft.setSync(serverCraft.sync);      
	  }

    for(i in data.others) {
      var serverEntity = data.others[i];
      var clientEntity = app.scene.getEntity(serverEntity.id);

      if(clientEntity)
        clientEntity.setSync(serverEntity.sync);
    }
  };

  self._sync = function(data) {
    var entity = app.scene.getEntity(data.id);
    if(!entity)
	    addHovercraftToScene(data.id, data.sync);
    else
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

  var addHovercraftToScene = function(id, sync) {
      var craftToAdd = hovercraftFactory.create(id);
      craftToAdd.setSync(sync);
      app.scene.addEntity(craftToAdd);
	    return craftToAdd;
  };
};

