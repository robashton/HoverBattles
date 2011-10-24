exports.ScoreKeepingReceiver = function(app, communication) {
  var self = this;
  var scores = { };

  self._ready = function(data) {
    scores[data.source] = 0;
    communication.sendMessage('updateAllScores', {
        scores: scores    
    });
  };

  self._removeplayer = function(data) {
    console.log(data.id);
    delete scores[data.id];
    communication.sendMessage('updateAllScores', {
        scores: scores    
    });
  };
  
  self._destroyTarget = function(data) {
    scores[data.sourceid]++;
    communication.sendMessage('updateScore', {
         playerid: data.sourceid,
         score: scores[data.sourceid]
    });
  };
};

