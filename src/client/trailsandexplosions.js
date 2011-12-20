var Missile = require('../entities/missile').Missile;
var Hovercraft  = require('../entities/hovercraft').Hovercraft;
var ParticleEmitter = require('../entities/particleemitter').ParticleEmitter;
var Explosion = require('../entities/explosion').Explosion;

exports.TrailsAndExplosions = function(app) { 
  var self = this;
  var trails = {};

  var onEntityAdded = function(entity) {
    if(entity.is(Hovercraft))
      setupEntityTrail(entity, createHovercraftTrail);
    else if(entity.is(Missile))
      setupEntityTrail(entity, createMissileTrail);
  };

  var onEntityRemoved = function(entity) {
    if(entity.is(Hovercraft) || entity.is(Missile))
      removeEntityTrail(entity);
  };

  var setupEntityTrail = function(entity, trailFactory) {
    var id = entity.getId();
    var trail = trailFactory(id + 'trail', entity);
    trails[id] = trail;
    app.scene.addEntity(trail);
  };

  var removeEntityTrail = function(entity) {
    var id = entity.getId();
    var trail = trails[id];
    app.scene.removeEntity(trail);
    delete trails[id];
  };

  var createMissileTrail = function(id, missile) {
    return new ParticleEmitter(id, 4000, app,
    {
        maxsize: 100,
        maxlifetime: 0.2,
        rate: 500,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        textureName: '/data/textures/missile.png',
        track: function(){
            this.position = vec3.create(missile.position);
        }
    });
  };

  var createHovercraftTrail = function(id, hovercraft) {
    return new ParticleEmitter(id, 100, app,
    {
        maxsize: 50,
        maxlifetime: 0.3,
        rate: 20,
        scatter: vec3.create([1.2, 0.001, 1.2]),
        particleOutwardVelocityMin: vec3.create([-0.9,-50.0,-0.9]),
        particleOutwardVelocityMax: vec3.create([0.9, -4.0,0.9]),
        track: function(){
            this.position = vec3.create([hovercraft.position[0], hovercraft.position[1] - 0.3 , hovercraft.position[2]]);
        },
        textureName: '/data/textures/trail.png'
    });
  };
  
  var onMissileExpired = function() {
    createExplosionAtLocation(this.position);
  };
  
  var onHovercraftExploded = function() {
    createExplosionAtLocation(this.position);
  };
  
  var onHovercraftLeftWorld = function() {
    createExplosionAtLocation(this.position);
  };
  
  var createExplosionAtLocation = function(position) {
    var explosion = new Explosion(app, {
      position: position,    
      initialVelocity: vec3.create([0,0,0])
      }
    );
  };
 
  app.scene.on('leftWorld', onHovercraftLeftWorld);
  app.scene.on('healthZeroed', onHovercraftExploded);
  app.scene.on('missileExpired', onMissileExpired);
  app.scene.onEntityAdded(onEntityAdded);
  app.scene.onEntityRemoved(onEntityRemoved);     
};
