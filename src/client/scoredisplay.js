var ScoreKeeper = require('../entities/scorekeeper').ScoreKeeper;

exports.ScoreDisplay = function(scene) {
  var self = this;

 var updateView = function() {
    var scoreKeeper = ScoreKeeper.GetFrom(scene);
    var scores = scoreKeeper.getScores();
    GlobalViewModel.setScores(scores);
  };

  self.setPlayerId = function(id) {
    GlobalViewModel.setPlayerId(id);
  };

  scene.on('fullSyncCompleted', updateView);
  scene.on('playerScoreChanged', updateView);
  scene.on('playerJoined', updateView);
  scene.on('playerLeft', updateView);
};
