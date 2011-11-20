var FiringController = require('../../shared/firingcontroller').FiringController;
var Missile = require('../../shared/missile').Missile;
var Destructable = require('../../shared/destructable').Destructable;
var Hovercraft = require('../../shared/hovercraft').Hovercraft;
var HovercraftSpawner = require('../../shared/hovercraftspawner').HovercraftSpawner;
var ScoreKeeper = require('../../shared/scorekeeper').ScoreKeeper;


var ForwardedEvents = {};
ForwardedEvents = [
   {
      type: FiringController,
      events: [
        'missileLock',
        'fireMissile'
      ]
   },
   {
      type: Missile,
      events: [
        'missileLost',
        'targetHit',
        'missileExpired'
      ]
   },
   {
     type: Destructable,
     events: [
      'entityDestroyed'
     ]
   },
   {
      type: Hovercraft,
      events: [
       'healthZeroed'
      ]
   },
   {
      type: HovercraftSpawner,
      events: [
        'entityRevived',
        'entitySpawned',
        'playerJoined',
        'playerLeft',
        'playerNamed'
      ]
   },
   {
      type: ScoreKeeper,
      events: [
        'playerScoreChanged'
      ]
   }
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var addEventProxy = function(event, type) {
     app.scene.on(event, group.type, function(data) {
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
    var group = ForwardedEvents[i];
    for(var j in group.events) {
      var event = group.events[j];
      addEventProxy(event, group.type);     
    }
  }
};
