var ParticleEmitter = require('./particleemitter').ParticleEmitter;

exports.Explosion = function(app, details) {
  var date = new Date();

  var directionOfExplosion = vec3.create([0,0,0]);
  var speed = vec3.length(details.initialVelocity);
  
  if(speed > 0.5) {
    vec3.normalize(details.initialVelocity, directionOfExplosion);
    vec3.scale(directionOfExplosion, 30.0);
  }

  var fireEmitter = new ParticleEmitter('Explosion-' + date, 5000, app,
  {
      maxsize: 1500,
      maxlifetime: 0.7,
      rate: 2000,
      position: details.position,
      scatter: vec3.create([0.2, 0.2, 0.2]),
      particleOutwardVelocityMin: vec3.create([-12,-12,-12]),
      particleOutwardVelocityMax: vec3.create([12,12,12]),
      particleTrajectoryVelocity: directionOfExplosion,
      textureName: '/data/textures/explosion.png'
  });
  app.scene.addEntity(fireEmitter);
  setTimeout(function() {
    fireEmitter.stop();
  }, 150);
  setTimeout(function() {
    app.scene.removeEntity(fireEmitter);
  }, 10000); 

  var smokeEmitter = new ParticleEmitter('Smoke-' + date, 1000, app,
  {
      maxsize: 1500,
      maxlifetime: 3.0,
      rate: 30,
      position: details.position,
      scatter: vec3.create([0.2, 0.2, 0.2]),
      particleOutwardVelocityMin: vec3.create([-5.0,0.5,-5.0]),
      particleOutwardVelocityMax: vec3.create([5.0,10.0,5.0]),
      textureName: '/data/textures/smoke.png'
  });

  app.scene.addEntity(smokeEmitter);

  setTimeout(function() {
    smokeEmitter.stop();
  }, 500);

  setTimeout(function() {
    app.scene.removeEntity(smokeEmitter);
  }, 10000);

};


