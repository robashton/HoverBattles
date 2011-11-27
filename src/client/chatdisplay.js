exports.ChatDisplay = function(communication, scene, playerId, inputController) {
  var self = this;
  var playerNameMap = {};  
  
  GlobalChatModel.setInputcontroller(inputController);
  
  self.receiveMessageFromServer = function(data) {
      GlobalChatModel.addMessage(
        playerNameMap[data.id], data.text);
  };
  
  var onPlayerNamed = function(data) {
    if(data.id === playerId)
      GlobalChatModel.setPlayerName(data.name);
  };
  
  var onPlayerNamesUpdated = function(data) {
    playerNameMap = data.names;
  };
  
  var onMessageSent = function(text) {
    communication.sendMessage('chatmessage', {
      text: text
    });
  };
  
  GlobalChatModel.onMessage(onMessageSent);
  
  scene.on('playerNamed', onPlayerNamed);
  scene.on('playerNamesUpdated', onPlayerNamesUpdated);
};
