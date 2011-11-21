var Entity = require('../core/entity').Entity;
var Hovercraft = require('./hovercraft').Hovercraft;
var HovercraftSpawner = require('./hovercraftspawner').HovercraftSpawner;

exports.ScoreKeeper = function(scene) {
  var self = this;
  var playerScores = {};

  self.getScores = function() {
    return playerScores;
  };

  self.setSync = function(sync) {
    playerScores = sync.playerScores;
  };

  self.updateSync = function(sync) {
    sync.playerScores = playerScores;
  };

  var onCraftDestroyed = function(data) {
   self.raiseServerEvent('playerScoreChanged', {
    id: data.sourceid,
    score: getPlayerScore(data.sourceid) + 1
   });
  };

  var onScoreChanged = function(data) {
    setPlayerScore(data.id, data.score);
  };

  var onPlayerJoined = function(data) {
    var player = ensurePlayer(data.id);
    player.score = 0;
  };

  var onPlayerLeft = function(data) {
    delete playerScores[data.id];
  };

  var onPlayerNamed = function(data) {
    setPlayerName(data.id, data.name);
  };

  var setPlayerName = function(playerId, name) {
    var player = ensurePlayer(playerId);
    if(!player) return;
    player.name = name;
  };

  var getPlayerScore = function(playerId) {
    var player = ensurePlayer(playerId);
    return player.score;
  };

  var setPlayerScore = function(playerId, score) {
    var player = ensurePlayer(playerId);
    player.score = score;
  };

  var ensurePlayer = function(id) {
     var player = playerScores[id];
     if(!player) {
      player = playerScores[id] = {
        name: '',
        score: 0
      };
     }
     return player;
  };

  self.addEventHandler('playerScoreChanged', onScoreChanged);
  scene.on('healthZeroed', onCraftDestroyed);
  scene.on('playerJoined', onPlayerJoined);
  scene.on('playerLeft',  onPlayerLeft); 
  scene.on('playerNamed', onPlayerNamed);
};

exports.ScoreKeeper.GetFrom = function(scene) {
  return scene.getEntity('score-keeper');
};

exports.ScoreKeeper.Create = function(scene) {
  var entity = new Entity('score-keeper');
  entity.attach(exports.ScoreKeeper, [scene]);
  scene.addEntity(entity);
  return entity;
};
