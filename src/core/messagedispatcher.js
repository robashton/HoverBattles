MessageDispatcher = function() {
  this.routeTable = {};
  this.receivers = [];
};

MessageDispatcher.prototype.addReceiver = function(receiver){
    for(var i in receiver){
     if(i.indexOf('_') !== 0) continue;
		var messageName = i.substr(1);
		
		if(!this.routeTable[messageName])
			this.routeTable[messageName] = [];

        this.routeTable[messageName].push(receiver);     
    }
};

MessageDispatcher.prototype.dispatch = function(message) {
  var receiverCollection = this.routeTable[message.command];
  if(!receiverCollection){
   console.log('Receiver not found for message: ' + message.command);
   return;
  }
  var length = receiverCollection.length;
  for(var i = 0; i < length; i++) {
	var receiver = receiverCollection[i];
    var method = receiver['_' + message.command];
    method.call(receiver, message.data);	
  }
};

exports.MessageDispatcher = MessageDispatcher;