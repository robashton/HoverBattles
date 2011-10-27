var ParticleEmitter = require('./particleemitter').ParticleEmitter;

exports.Explosion = function(app, details) {
  var date = new Date();

  var directionOfExplosion = vec3.create([0,0,0]);
  var speed = vec3.length(details.initialVelocity);
  
  if(speed > 0.5) {
    vec3.normalize(details.initialVelocity, directionOfExplosion);
    vec3.scale(directionOfExplosion, 30.0);
  }

  var emitter = new ParticleEmitter('Explosion-' + date, 10000, app,
  {
      maxsize: 300,
      maxlifetime: 0.8,
      rate: 1400,
      position: details.position,
      scatter: vec3.create([0.2, 0.2, 0.2]),
      particleOutwardVelocity: vec3.create([20,20,20]),
      particleTrajectoryVelocity: directionOfExplosion
  });

  app.scene.addEntity(emitter);

  setTimeout(function() {
    emitter.stop();
  }, 150);

  setTimeout(function() {
    app.scene.removeEntity(emitter);
  }, 10000); 
};


