exports.EventContainer = function() {
  var self = this;
  var handlers = [];

  self.raise = function(source, data) {
    for(var i = 0; i < handlers.length; i++)
      handlers[i].call(source, data);
  };
 
  self.add = function(handler) {
    handlers.push(handler);
  };

  self.remove = function(handler) {
    var newItems = [];
    for(var i = 0; i < handlers.length; i++)
        if(handlers[i] !== handler) 
          newItems.push(handlers[i]);
    handlers = newItems;
  };
};
