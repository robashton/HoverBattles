exports.EventReceiver = function(scene) {
  var self = this;

  self._entityEvent = function(msg) {
    scene.withEntity(msg.id, function(entity) {
      entity.raiseEvent(msg.event, msg.data);
    });
  };
};
