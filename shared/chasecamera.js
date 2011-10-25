var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var ChaseCamera = {
  cameraMode: "chase",
  entity: null,

  _ctor: function() {
      this.cameraLocation = vec3.create([0,100,0]);
      this.cameraLookAt = vec3.create([0,0,0]);
      this.destinationCameraLocation = vec3.create([0,0,0]);
      this.destinationCameraLookAt = vec3.create([0,0,0]);

      this.movementDelta = 0.1;
      this.lookAtDelta = 0.7;
      this.fixLocation = false;

      this.cameraVelocity = vec3.create([0,0,0]);
      this.lookAtVelocity = vec3.create([0,0,0]);
  },

  setTrackedEntity: function(entity) {
    this.entity = entity;
  },

  fixLocationAt: function(position) {
      this.fixLocation = true;
      this.destinationCameraLocation = vec3.create(position);
  },

  unfixLocation: function() {
      this.fixLocation = false;
  },

  setMovementDelta: function(delta) {
    this.movementDelta = delta;
  },
  
  setLookAtDelta: function(delta) {
    this.lookAtDelta = delta;
  },

  doLogic: function(){      
    this.workOutWhereTargetIs();
    this.doLogicAfterAscertainingTarget();
  },

  workOutWhereTargetIs: function() {
     var terrain = this._scene.getEntity("terrain");      
     var cameraTrail = vec3.create(this.entity._velocity);

     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 25);
     vec3.subtract(this.entity.position, cameraTrail, cameraTrail);

     var desiredCameraLocation = cameraTrail;

     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.entity.position[1] + 10);
     
     desiredCameraLocation[1] =  cameraHeight;  
    

     this.destinationCameraLookAt = vec3.create(this.entity.position);

     if(!this.fixLocation)
      this.destinationCameraLocation = desiredCameraLocation;
  },

  doLogicAfterAscertainingTarget: function() {
    var directionToWhereWeWantToBe = vec3.create([0,0,0]);
    vec3.subtract(this.destinationCameraLocation, this.cameraLocation, directionToWhereWeWantToBe);
    vec3.scale(directionToWhereWeWantToBe, this.movementDelta , this.cameraVelocity);
    vec3.add(this.cameraLocation, this.cameraVelocity); 

    var directionToWhereWeWantToLookAt = vec3.create([0,0,0]);
    vec3.subtract(this.destinationCameraLookAt, this.cameraLookAt, directionToWhereWeWantToLookAt);
    vec3.scale(directionToWhereWeWantToLookAt, this.lookAtDelta , this.lookAtVelocity);
    vec3.add(this.cameraLookAt, this.lookAtVelocity); 

    this._scene.camera.lookAt = vec3.create(this.cameraLookAt);
    this._scene.camera.location = vec3.create(this.cameraLocation);
  },  
};

exports.ChaseCamera = ChaseCamera;
