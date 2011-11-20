var FiringController = require('../../shared/firingcontroller').FiringController;
var Missile = require('../../shared/missile').Missile;
var Destructable = require('../../shared/destructable').Destructable;
var Hovercraft = require('../../shared/hovercraft').Hovercraft;
var HovercraftSpawner = require('../../shared/hovercraftspawner').HovercraftSpawner;
var ScoreKeeper = require('../../shared/scorekeeper').ScoreKeeper;


var ForwardedEvents = [
  'missileLock',
  'fireMissile',
  'missileLost',
  'targetHit',
  'missileExpired',
  'entityDestroyed',
  'healthZeroed',
  'entityRevived',
  'entitySpawned',
  'playerJoined',
  'playerLeft',
  'playerNamed',
  'playerScoreChanged'
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var addEventProxy = function(event, type) {
     app.scene.on(event, function(data) {
        forwardEventForEntity(event, this.getId(), data);
     });
  };

  var forwardEventForEntity = function(event, id, data) {
    console.log('Forwarding ' + event + ' from ' + id);
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
