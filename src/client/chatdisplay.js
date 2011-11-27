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
  
  var onPlayerKilled = function(data) {
    GlobalChatModel.addEvent(playerNameMap[data.sourceid] + ' killed ' + playerNameMap[data.targetid]);
  };
  
  var onPlayerFellOffWorld = function(data) {
    GlobalChatModel.addEvent(playerNameMap[this.getId()] + ' fell off the world');
  };
  
  GlobalChatModel.onMessage(onMessageSent);
  
  scene.on('playerNamed', onPlayerNamed);
  scene.on('playerNamesUpdated', onPlayerNamesUpdated);
  scene.on('healthZeroed', onPlayerKilled);
  scene.on('leftWorld', onPlayerFellOffWorld);
};
