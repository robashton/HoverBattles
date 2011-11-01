var data = require('../data').Data;

exports.PersistenceReceiver = function() {
  var self = this;
  var playerNameMap = {};
  
  self._fireMissile = function(data) {
    storeEvent('missileFired', {
      targetuser: playerNameMap[data.targetid],
      targetsessionid: data.targetid,
      sourceuser: playerNameMap[data.sourceid],
      sourcesessionid: data.sourceid
    });
  };

  self._playerNamed = function(data) {
    playerNameMap[data.id] = data.username;
    storeEvent('playerStart', {
      username: data.username,
      sessionid: data.id
    });
  };

  self._destroyTarget = function(data) {
    storeEvent('playerKilled', {
      targetuser: playerNameMap[data.targetid],
      targetsessionid: data.targetid,
      sourceuser: playerNameMap[data.sourceid],
      sourcesessionid: data.sourceid
    });
  };

  var storeEvent = function(eventName, eventData) {
    data.storeEvent(eventName, eventData);
  };
};
