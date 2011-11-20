var Entity = require('./entity').Entity;
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
    playerScores[data.id] = {
      name: '',
      score: 0
    };
  };

  var onPlayerLeft = function(data) {
    delete playerScores[data.id];
  };

  var onPlayerNamed = function(data) {
    setPlayerName(data.id, data.name);
  };

  var setPlayerName = function(playerId, name) {
    var player = playerScores[playerId];
    if(!player) return;
    player.name = name;
  };

  var getPlayerScore = function(playerId) {
    if(playerScores[playerId])
      return playerScores[playerId].score;
    return 0;
  };

  var setPlayerScore = function(playerId, score) {
    var player = playerScores[playerId];
    if(!player) return;
    player.score = score;
  };

  self.addEventHandler('playerScoreChanged', onScoreChanged);
  scene.on('healthZeroed', Hovercraft, onCraftDestroyed);
  scene.on('playerJoined', HovercraftSpawner, onPlayerJoined);
  scene.on('playerLeft', HovercraftSpawner, onPlayerLeft); 
  scene.on('playerNamed', HovercraftSpawner, onPlayerNamed);
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
