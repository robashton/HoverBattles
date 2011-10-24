var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var ChaseCamera = {
  cameraMode: "chase",
  entity: null,

  _ctor: function() {
      this.cameraLocation = vec3.create([0,100,0]);
      this.cameraVelocity = vec3.create([0,0,0]);
      this.targetVelocity = vec3.create([0,0,0]);
      
  },

  setTrackedEntity: function(entity) {
    this.entity = entity;
    this.cameraLocation = vec3.create(this.entity.position);
    this.cameraLocation[1] = 10;
  },

  doLogic: function(){      
    this._scene.camera.location = vec3.create(this.cameraLocation);
    if(this.cameraMode === "chase")
      this.doLogicForChaseCamera();
    else if(this.cameraMode === "death")
      this.doLogicForDeathCamera();
    else
      throw "Camera is in an invalid state, wtf dude?";
  },

  doLogicForChaseCamera: function() {
     var terrain = this._scene.getEntity("terrain");
      
     this._scene.camera.lookAt = this.entity.position;     
     var cameraTrail = vec3.create(this.entity._velocity);

     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 30);
     vec3.subtract(this.entity.position, cameraTrail, cameraTrail);

     var desiredCameraLocation = cameraTrail;

     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.entity.position[1] + 15);
     
     desiredCameraLocation[1] =  cameraHeight;
  
     this.destinationCameraLocation = desiredCameraLocation;
     this.targetVelocity = vec3.create(this.entity._velocity);
     this.doLogicAfterAscertainingTarget();
  },

  doLogicForDeathCamera: function() {   
    this.doLogicAfterAscertainingTarget();
  },

  doLogicAfterAscertainingTarget: function() {

    var directionToWhereWeWantToBe = vec3.create();
    vec3.subtract(this.destinationCameraLocation, this.cameraLocation, directionToWhereWeWantToBe);
    var distance = vec3.length(directionToWhereWeWantToBe);
    var movementTowardsDestination = 0.1;

    vec3.scale(directionToWhereWeWantToBe, movementTowardsDestination, this.cameraVelocity);

    vec3.add(this.cameraLocation, this.cameraVelocity); 
    this._scene.camera.location = new vec3.create(this.cameraLocation);
  },

  startZoomingOutChaseCamera: function() {
    var self = this;
    this.cameraMode = "death";
    this.destinationCameraLocation = vec3.create(this.entity.position);

  
    this.destinationCameraLocation[1] = 200.0;

    setTimeout(function() {
      self.destinationCameraLocation[1] = 700;
    }, 1500);

    this.targetVelocity = vec3.create([0,0,0]);
  },

  startZoomingBackInChaseCamera: function() {
    this.cameraMode = "chase";
  }
  
};

exports.ChaseCamera = ChaseCamera;
