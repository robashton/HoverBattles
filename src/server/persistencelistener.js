var data = require('./data').Data;

exports.PersistenceListener = function(scene) {
  var self = this;
  var playerNameMap = {};
  
  var onMissileFired = function(data) {
    storeEvent('missileFired', {
      targetuser: playerNameMap[data.targetid],
      targetsessionid: data.targetid,
      sourceuser: playerNameMap[data.sourceid],
      sourcesessionid: data.sourceid
    });
  };

  var onPlayerNamed = function(data) {
    playerNameMap[data.id] = data.username;
    storeEvent('playerStart', {
      username: data.username,
      sessionid: data.id
    });
  };

  var onPlayerKilled = function(data) {
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

  scene.on('playerNamed', onPlayerNamed);
  scene.on('healthZeroed', onPlayerKilled);
  scene.on('fireMissile', onMissileFired);
};
