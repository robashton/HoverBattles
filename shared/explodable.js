var Explosion = require('./explosion').Explosion;

exports.Explodable = function() {
  var self = this;

  var onEntityDestroyed = function() {
    var explosion = new Explosion(self._scene.app, {
      position: self.position,    
      initialVelocity: vec3.create([0,0,0])
      }
    );    
  };  

  self.addEventHandler('entityDestroyed', onEntityDestroyed);

};
