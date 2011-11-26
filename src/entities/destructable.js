exports.Destructable = function() {
  var self = this;

  var onNoHealthLeft = function(data) {
    self.raiseServerEvent('entityDestroyed', {
      id: self.getId()
    });
  };

  var onLeftWorld = function(data) {
    self.raiseServerEvent('entityDestroyed', {
      id: self.getId()
    });
  };

  self.addEventHandler('healthZeroed', onNoHealthLeft);
  self.addEventHandler('leftWorld', onLeftWorld);
};
