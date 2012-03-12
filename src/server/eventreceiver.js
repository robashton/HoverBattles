var ForwardedEvents = [
  'missileLock',
  'startedFiring',
  'finishedFiring',
  'fireMissile',
  'missileLost',
  'targetHit',
  'missileExpired',
  'entityDestroyed',
  'leftWorld',
  'healthZeroed',
  'entityRevived',
  'entitySpawned',
  'playerJoined',
  'playerLeft',
  'playerNamed',
  'playerScoreIncreased',
  'playerScoreDecreased',
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var addEventProxy = function(event, type) {
     app.scene.on(event, function(data) {
        forwardEventForEntity(event, this.getId(), data);
     });
  };

  var forwardEventForEntity = function(event, id, data) {
    communication.sendMessage('entityEvent', {
      id: id,
      event: event,
      data: data
    });
  }; 

  self._entityEvent = function(msg) {
  };

  for(var i in ForwardedEvents) {
    var event = ForwardedEvents[i];
    addEventProxy(event);     
  }
};
