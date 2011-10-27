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
    if(!entity.notifyAimingAt) return;
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  };

  app.scene.onEntityAdded(hookHovercraftEvents);

  self.setPlayerId = function(id) {
    playerId = id;
  };
  
  onPlayerTrackingTarget = function(targetId) {
     $('#targettingStatus').html('<p>You\'ve got them in your sights</p>');
  };

  onPlayerBeingTracked = function(sourceId) {
    $('#targettedStatus').html('You\'re being targetted');
  };

  onPlayerCancelledBeingTracked  =  function() {
    $('#targettedStatus').html('<p>Home free</p>');
  };

  onPlayerCancelledTrackingTarget = function() {
    $('#targettingStatus').html('<p>Lost the lock :(</p>');
  };

/*

  self.alertBeingFiredOn = function() { 
    $('#targettedStatus').html('<p>They\'ve fired a missile!!</p>');
  };

  self.updateBeingFiredOn = function() {
    $('#targettedStatus').html('<p>Missile is getting closer!!"</p>');
  };

  };

  self.alertLocked = function() {
    $('#targettingStatus').html('<p>You\'ve got them locked, firing!</p>');
  };

  self.updateFiringStatus = function() {
    $('#targettingStatus').html('<p>Missile is getting closer</p>');
  };
*/
};

exports.Hud.ID = "HUDEntity";
exports.Hud.create = function(app) {
  var hudEntity = new Entity(exports.Hud.ID);
  hudEntity.attach(exports.Hud, [app]);

  app.scene.addEntity(hudEntity);
};



