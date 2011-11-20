var ScoreKeeper = require('../scorekeeper').ScoreKeeper;

exports.ScoreDisplay = function(scene) {
  var self = this;

  var onPlayerScoreChanged = function(data) {
    var scoreKeeper = ScoreKeeper.GetFrom(scene);
    var scores = scoreKeeper.getScores();
    GlobalViewModel.setScores(scores);
  };

  scene.on('playerScoreChanged', ScoreKeeper, onPlayerScoreChanged);  
};
