var Explosion = require('./explosion').Explosion;

exports.Explodable = function() {
  var self = this;

  var onEntityDestroyed = function() {
    createExplosionAtEntityLocation();
  };

  var onLeftWorld = function() {
    createExplosionAtEntityLocation();
  };
  
  var createExplosionAtEntityLocation = function() {
    console.log('kaboom: ' + self.position);
    var explosion = new Explosion(self._scene.app, {
      position: self.position,    
      initialVelocity: vec3.create([0,0,0])
      }
    );
  };
 
  self.addEventHandler('healthZeroed', onEntityDestroyed);
  self.addEventHandler('leftWorld', onLeftWorld);
};
