exports.Destructable = function() {
  var self = this;

  var onNoHealthLeft = function() {
    self.raiseServerEvent('entityDestroyed');
    self._scene.removeEntity(self);
  };

  self.addEventHandler('healthZeroed', onNoHealthLeft);
};
