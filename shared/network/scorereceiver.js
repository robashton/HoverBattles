exports.ScoreReceiver = function(app, communication) {
  var self = this;
  var scores = { };

  self._updateScore = function(data) {
      scores[data.playerid] = data.score;
      GlobalViewModel.setScores(scores);
  };



};
