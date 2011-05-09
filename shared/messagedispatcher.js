MessageDispatcher = function() {
  this.routeTable = {};
  this.receivers = [];
};

MessageDispatcher.prototype.addReceiver = function(receiver){
    for(var i in receiver){
     if(i.indexOf('_') !== 0) continue;
        this.routeTable[i.substr(1)] = receiver;     
    }
};

MessageDispatcher.prototype.dispatch = function(message) {
  var receiver = this.routeTable[message.command];
  if(!receiver){
   console.log('Receiver not found for message: ' + message.command);
   return;
  }
  var method = receiver['_' + message.command];
  method.call(receiver, message.data);  
};

exports.MessageDispatcher = MessageDispatcher;