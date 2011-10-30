exports.ScoreReceiver = function(app, communication) {
  var self = this;
  var scores = { };

  self._updateScore = function(data) {
      scores[data.playerid] = data.value;
      GlobalViewModel.setScores(scores);
  };

  self._updateAllScores = function(data) {
      scores = data.scores;
      GlobalViewModel.setScores(scores);
  };

};
