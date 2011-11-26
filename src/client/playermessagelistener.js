exports.PlayerMessageListener = function(app) {
  var self = this;
  
  var playerId = null;
  var playerNameMap = {};
  var currentMessage = null;
  var currentMessageTimer = null;

  self.setPlayerId = function(id) {
    playerId = id;
  };

  var onPlayerNamed = function(data) {
    playerNameMap[data.id] = data.name;
  };

  var onCraftDestroyed = function(data) {
    if(data.sourceid === playerId)
      notifyPlayerHeKilledSomebody(data);
    else if(data.targetid === playerId)
      notifyPlayerWasKilled(data);
  };

  var onLeftWorld = function(data) {
    if(this.getId() === playerId)
      notifyPlayerFellOffWorld();
  };

  var notifyPlayerHeKilledSomebody = function(data) {
    var message = 'You killed ' + playerNameMap[data.targetid];
    showMessage(message);
  };

  var notifyPlayerWasKilled = function(data) {
    var message = 'Killed by ' + playerNameMap[data.sourceid];
    showMessage(message);
  };

  var notifyPlayerFellOffWorld = function(data) {
    var message = 'Fell off edge of world';
    showMessage(message);
  };

  var showMessage = function(msg) {
    removeCurrentMessage();   

    currentMessage = app.overlay.addTextItem('player-message', msg, 450, 50, 'red', 'bold 24px verdana'); 
    currentMessage.top(200);
    currentMessage.left(300);
    currentMessageTimer = setTimeout(removeCurrentMessage, 3000); 
  };

  var removeCurrentMessage = function(){
    if(currentMessage) {
      app.overlay.removeItem(currentMessage);
      clearTimeout(currentMessageTimer);
      currentMessage = null;
      currentMessageTimer = null;
    }
  };

  app.scene.on('playerNamed', onPlayerNamed);
  app.scene.on('healthZeroed', onCraftDestroyed);
  app.scene.on('leftWorld', onLeftWorld);
};
