var Entity = require('./entity').Entity;
var Hovercraft = require('./hovercraft').Hovercraft;


exports.ScoreKeeper = function(scene) {
  var self = this;
  var playerScores = {};

  var onEntityAdded = function(entity) {
    if(!entity.is(Hovercraft)) return;
    hookCraftEvents(entity);
  };

  var onEntityRemoved = function(entity) {
    if(!entity.is(Hovercraft)) return;
    unhookCraftEvents(entity);
  };

  var hookCraftEvents = function(craft) {
    craft.addEventHandler('healthZeroed', onCraftDestroyed);
  };

  var unhookCraftEvents = function(craft) {
    craft.removeEventHandler('healthZeroed', onCraftDestroyed);
  };

  var onCraftDestroyed = function(data) {
     self.raiseServerEvent('playerScoreIncreased', data.sourceid);
  };

  var onScoreIncreased = function(data) {
    // Increase the player score
  };

  scene.onEntityAdded(onEntityAdded);
  scene.onEntityRemoved(onEntityRemoved);
};

exports.ScoreKeeper.Create = function(scene) {
  var entity = new Entity('score-keeper');
  entity.attach(exports.ScoreKeeper, [scene]);
  return entity;
};
