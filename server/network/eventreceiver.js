var FiringController = require('../../shared/firingcontroller').FiringController;
var Missile = require('../../shared/missile').Missile;

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
   }
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var hookEvents = function(entity) {
    for(var i in ForwardedEvents) {
      var ev = ForwardedEvents[i];
      if(entity.is(ev.type))
        hookEventsForType(ev.events, entity);
    }
  };

  var unhookEvents = function(entity) {
    for(var i in ForwardedEvents) {
      var ev = ForwardedEvents[i];
      if(entity.is(ev.type))
        unhookEventsForType(ev.events, entity);
    }
  };  

  var hookEventsForType = function(events, entity) {
    for(i in events)
      hookEventHandlerFor(events[i], entity);
  };

  var unhookEventsForType = function(events, entity) {
    for(i in events)
      unhookEventHandlerFor(events[i], entity);
  };

  var hookEventHandlerFor = function(event, entity) {
    entity.addEventHandler(event, function(data) {
      forwardEventForEntity(event, entity.getId(), data);
    });
  };

  var unhookEventHandlerFor = function(event, entity) {
    entity.removeEventHandler(event, function(data) {
      forwardEventForEntity(event, entity.getId());
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
    console.log('Ignoring event because our messaging structure is changing');
  };  

  app.scene.onEntityAdded(hookEvents);
  app.scene.onEntityRemoved(unhookEvents);
};
