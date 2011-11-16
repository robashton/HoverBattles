var Hud = require('../hud').Hud;

exports.HudReceiver = function(app, communication) {
  var self = this;
  var app = app;
  var communication = communication;

  self._init = function(data) {
    app.scene.withEntity(Hud.ID, function(hud) {
      hud.setPlayerId(data.id);
    });
  };  

  self._destroyMissile = function(data) {
    app.scene.withEntity(Hud.ID, function(hud) {
      hud.notifyOfMissileDestruction(data);
    });
  };

  self._missileLockLost = function(data) {
    app.scene.withEntity(Hud.ID, function(hud) {
        hud.notifyOfLockLost(data);
    });
  };

  self._destroyTarget = function(data) {
    app.scene.withEntity(Hud.ID, function(hud) {
        hud.notifyOfHovercraftDestruction(data);
    });
  };

   
};
