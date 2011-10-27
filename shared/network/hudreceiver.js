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
};
