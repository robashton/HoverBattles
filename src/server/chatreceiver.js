exports.ChatReceiver = function(app, communication) {
  var self = this;
  
  self._chatmessage = function(data) {
		sendMessageToOtherClients(data);
		storeMessageInPersistence(data);				
  };
  
  var sendMessageToOtherClients = function(data) {
    communication.broadcast('addchatmessage', { 
		  text: data.text,
		  id: data.source
		}, data.source);
  };
  
  var storeMessageInPersistence = function(data) {
        
  };  
};
