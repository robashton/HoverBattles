exports.TypedEventContainer = function() {
  var self = this;
  var eventHandlers = {};

  self.add = function(eventName, type, callback) {
    var container = ensureGetContainerForTypeAndEvent(eventName, type); 
    container.addHandler(callback);
  };

  self.remove = function(eventName, type, callback) {
    var container = ensureGetContainerForTypeAndEvent(eventName, type); 
    container.removeHandler(callback);
  };

  self.raise = function(source, eventName, data) {
    var eventContainer = eventHandlers[eventName];
    if(!eventContainer) return;

    for(var i = 0; i < eventContainer.length; i++)
      if(eventContainer[i].isForEntity(source))
        eventContainer[i].raise(source, data);   
  };

  var ensureGetContainerForTypeAndEvent = function(eventName, type) {
    var containers = ensureGetEventHandlerContainers(eventName);
    for(var i = 0 ; i < containers.length; i++)
      if(containers[i].isForType(type))
        return containers[i];

    var container = new EventHandlerContainer(type);
    containers.push(container);
    return container;
  };


  var ensureGetEventHandlerContainers = function(eventName) {
    var containers = eventHandlers[eventName];
    if(!containers){ 
      containers = [];
      eventHandlers[eventName] = containers;
    }
    return containers;
  };
};

var EventHandlerContainer = function(type) {
  var self = this;
  var handlers = [];

  self.raise = function(source, data) {
    for(var i = 0; i < handlers.length; i++)
      handlers[i].call(source, data);
  };

  self.isForType = function(otherType) {
    return type === otherType;
  };

  self.isForEntity = function(entity) {
    return entity.is(type);
  };
  
  self.addHandler = function(handler) {
    handlers.push(handler);
  };

  self.removeHandler = function(handler) {
    var newItems = [];
    for(var i = 0; i < handlers.length; i++)
        if(handlers[i] !== callback) 
          newItems.push(handlers[i]);
    handlers = newItems;
  };
};
