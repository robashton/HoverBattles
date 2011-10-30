exports.ScoreKeepingReceiver = function(app, communication) {
  var self = this;
  var scores = { };
  var mappedNames = {};

  self._ready = function(data) {
    scores[data.source] = { 
       value: 0,
       name: ''
    };
    updatePlayerName(data.source);
    communication.sendMessage('updateAllScores', {
        scores: scores    
    });
  };

  self._removeplayer = function(data) {
    delete scores[data.id];
    communication.sendMessage('updateAllScores', {
        scores: scores    
    });
  };
  
  self._destroyTarget = function(data) {
    scores[data.sourceid].value ++;

    communication.sendMessage('updateScore', {
       playerid: data.sourceid,
       value: scores[data.sourceid]       
    });
  };

  self._playerNamed = function(data) {
     mappedNames[data.id] = data.username;
     updatePlayerName(data.id);
     communication.sendMessage('updateAllScores', {
          scores: scores    
     });
  };

  updatePlayerName = function(id) {
    if(mappedNames[id] && scores[id])
       scores[id].name = mappedNames[id];
  };
};
