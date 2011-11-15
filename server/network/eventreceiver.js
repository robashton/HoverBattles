var FiringController = require('../FiringController').FiringController;

var ForwardedEvents = {};
ForwardedEvents[FiringController] = [
  'targetHit',
  'missileLost',
  'missileExpired'
];

exports.EventReceiver = function(app, communication) {
  var self = this;

  var hookEvents = function(entity) {
    for(var type in ForwardedEvents)
      if(entity.is(type))
        hookEventsForType(type, entity);
  };

  var unhookEvents = function(entity) {
    for(var type in ForwardedEvents)
      if(entity.is(type))
        unhookEventsForType(type, entity);
  };  

  var hookEventsForType = function(type, entity) {
    for(event in ForwardedEvents[type])
      hookEventHandlerFor(type, event, entity);
  };

  var unhookEventsForType = function(type, entity) {
    for(event in ForwardedEvents[type])
      unhookEventHandlerFor(type, event, entity);
  };

  var hookEventHandlerFor = function(type, event, entity) {
    entity.addEventHandler(event, function(data) {
      forwardEventForEntity(event, entity.getId(), data);
    });
  };

  var unhookEventHandlerFor = function(type, event, entity) {
    entity.removeEventHandler(event, function(data) {
      forwardEventForEntity(event, entity.getId());
    });
  };

  var forwardEventForEntity = function(event, id, data) {
    communication.sendMessage('entityEvent', {
      id: id,
      data: data
    });
  }; 

  self._entityEvent = function(msg) {
    console.log('Ignoring event because our messaging structure is changing');
  };  

  app.scene.onEntityAdded(hookEvents);
  app.scene.onEntityRemoved(unhookEvents);
};
