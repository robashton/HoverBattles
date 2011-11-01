exports.ScoreReceiver = function(app, communication) {
  var self = this;
  var scores = { };

  var playerId = null;

  self._updateScore = function(data) {
      scores[data.playerid] = data.value;
      GlobalViewModel.setScores(scores);
  };

  self._updateAllScores = function(data) {
      scores = data.scores;
      GlobalViewModel.setScores(scores);
  };

  self._init = function(data) {
    playerId = data.id;
  };

  self._playerNamed = function(data) {
      if(data.id === playerId)
        GlobalViewModel.setPlayerInfo(playerId, data.username);
  };

};
