var Hovercraft = require('./hovercraft').Hovercraft;

exports.Hud = function(app) {
  var self = this;
  var app = app;
  var playerId = null;

  onEntityTrackingTarget = function(data) {
    if(this.getId() === playerId)
      onPlayerTrackingTarget(data.target.getId());      
    else if(data.target.getId() == playerId)
      onPlayerBeingTracked(this.getId());
  };
  
  onEntityCancelledTrackingTarget = function(data) {
    if(this.getId() === playerId)
      onPlayerCancelledTrackingTarget();
    else if(data.target.getId() === playerId)
      onPlayerCancelledBeingTracked();
  };

  hookHovercraftEvents = function(entity) {
    if(!entity.is(Hovercraft)) return;
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  };

  app.scene.onEntityAdded(hookHovercraftEvents);

  self.setPlayerId = function(id) {
    playerId = id;
  };

  self.notifyOfMissileFiring = function(data) {
    if(data.sourceid === playerId)
      onPlayerFired();
    else if(data.targetid === playerId)
      onPlayerFiredOn();
  };

  self.notifyOfMissileDestruction = function(data) {
    if(data.sourceid === playerId)
      onPlayerLostMissile();
    else if(data.targetid === playerId)
      onPlayerEvadedMissile();
  };

  self.notifyOfMissileLock = function(data) {
    if(data.sourceid === playerId)
      onPlayerLocked();
    else if(data.targetid === playerId)
      onOpponentLocked();
  };

  onPlayerLocked = function() {
    $('#targettingStatus').html('<p>You\'ve locked on, fire fire fire!</p>');
  };

  onOpponentLocked = function() {
    $('#targettedStatus').html('<p>You\'re locked onto, get out of there!</p>');
  }; 
  
  onPlayerTrackingTarget = function(targetId) {
     $('#targettingStatus').html('<p>You\'ve got them in your sights</p>');
  };

  onPlayerBeingTracked = function(sourceId) {
    $('#targettedStatus').html('You\'re being targetted');
  };

  onPlayerCancelledBeingTracked = function() {
    $('#targettedStatus').html('<p>Home free</p>');
  };

  onPlayerCancelledTrackingTarget = function() {
    $('#targettingStatus').html('<p>Lost the lock :(</p>');
  };

  onPlayerFired = function() {
    $('#targettingStatus').html('<p>Fired on target!</p>');
  };

  onPlayerFiredOn = function(){ 
    $('#targettedStatus').html('<p>They\'ve fired, get out of the way</p>');
  };

  onPlayerLostMissile = function() {
    $('#targettingStatus').html('<p>Target lost, missile destroyed</p>');
  };

  onPlayerEvadedMissile = function() {
    $('#targettedStatus').html('<p>They missed you, good job!</p>'); 
  };
};

exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
};



