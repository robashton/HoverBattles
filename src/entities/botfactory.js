var DESIRED_PLAYER_COUNT = 8;

exports.BotFactory = function(scene, spawner) {
  var self = this;
  
  var playerCount = 0;
  var updatingBots = false;
  
  var botCount = 0;
  var bots = [];
  var currentBotIndex = 0;
    
  var onPlayerJoined = function() {
    playerCount++;
    updateBotCountIfNecessary();
  };
  
  var onPlayerLeft = function() {
    playerCount--;
    updateBotCountIfNecessary();
  };
    
  var updateBotCountIfNecessary = function() {
    if(updatingBots) return;
    updatingBots = true;
    
    if(playerCount < DESIRED_PLAYER_COUNT) {
      createBots(DESIRED_PLAYER_COUNT - playerCount);
    } else if (playerCount > DESIRED_PLAYER_COUNT) {
      cullBots(playerCount - DESIRED_PLAYER_COUNT);
    }
    updatingBots = false;
  };  
  
  var createBots = function(number) {
    while(number-- > 0) {
      addBotToScene();        
    }
  };
  
  var cullBots = function(number) {
    while(botCount > 0 && number > 0) {
      number--;
      removeBotFromScene();
    }
  };
  
  var addBotToScene = function() {
    botCount++;
    var botId = 'bot-' + (currentBotIndex + bots.length);
    bots.push(botId);
    spawner.createPlayer(botId);
    spawner.namePlayer(botId, botId);
  };
  
  var removeBotFromScene = function() {
    botCount--;
    var botId = bots[currentBotIndex];
    delete bots[currentBotIndex++];
    spawner.removePlayer(botId);
  };
  
  scene.on('playerJoined', onPlayerJoined);
  scene.on('playerLeft', onPlayerLeft);  
};
