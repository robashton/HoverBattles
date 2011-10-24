exports.ScoreKeepingReceiver = function(app, communication) {
  var self = this;
  var scores = { };

  self._ready = function(data) {
    scores[data.source] = 0;
    communication.sendMessage('updateScore', {
        playerid: data.source,
        score: 0       
    });
  };
  
  self._destroyTarget = function(data) {
    scores[data.targetid]++;
    communication.sendMessage('updateScore', {
         playerid: data.targetid,
         score: scores[data.targetid]
    });
  };
};

