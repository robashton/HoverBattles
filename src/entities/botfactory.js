var Bot = require('./bot').Bot;
var DESIRED_PLAYER_COUNT = 30;


exports.BotFactory = function(communication, scene, spawner) {
  var self = this;
  
  var playerCount = 0;
  var updatingBots = false;
  
  var currentBotId = 0;
  var botsById = {};
  var botCount = 0;
    
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
    var botId = 'bot-' + currentBotId++;
    botsById[botId] = new TrackedBot(botId);
    spawner.createPlayer(botId);
    spawner.namePlayer(botId, botId);
  };
  
  var removeBotFromScene = function() {
    botCount--;
    for(var i in botsById) {
      removeBotById(i);
      return;
    }
  };
  
  var removeBotById = function(id) {
    var bot = botsById[id];
    delete botsById[id];
    spawner.removePlayer(bot.getId());
  };
  
  var onEntitySpawned = function(data) {
    if(data.id.indexOf('bot-') !== 0) return;
    scene.withEntity(data.id, function(craft) {
      craft.attach(Bot, [communication]);
    });
  };
  
  var onPlayerKilled = function(data) {
    var bot = botsById[data.sourceid];
    if(!bot) return;    
    bot.increaseScore();
    if(bot.getScore() < 10) return;
    removeBotById(data.sourceid);    
  };
   
  scene.on('healthZeroed', onPlayerKilled);
  scene.on('playerJoined', onPlayerJoined);
  scene.on('playerLeft', onPlayerLeft);  
  scene.on('entitySpawned', onEntitySpawned);  
};


var TrackedBot = function(id) {
  var self = this;
  var score = 0;
  
  self.getId = function() {
    return id;
  };
  
  self.increaseScore = function() {
    score++;
  };
  
  self.getScore = function() {
    return score;
  };    
};
