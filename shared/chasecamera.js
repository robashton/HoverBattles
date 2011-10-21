var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var ChaseCamera = {
  cameraMode: "chase",
  entity: null,

  setTrackedEntity: function(entity) {
    this.entity = entity;
  },

  doLogic: function(){      
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
     vec3.scale(cameraTrail, 50);
     vec3.subtract(this.entity.position, cameraTrail, cameraTrail);

     this._scene.camera.location = cameraTrail;
     
     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.entity.position[1] + 15);
     
     this._scene.camera.location[1] =  cameraHeight;

     // Note: This should really be integrated with the above logic
     this.cameraLocation = vec3.create(this._scene.camera.location);
  },

  doLogicForDeathCamera: function() {   
    var directionToWhereWeWantToBe = vec3.create();
    vec3.subtract(this.destinationCameraLocation, this.cameraLocation, directionToWhereWeWantToBe);
    vec3.normalize(directionToWhereWeWantToBe);

    vec3.scale(directionToWhereWeWantToBe, 0.1);
    vec3.add(this.cameraVelocity, directionToWhereWeWantToBe);    
    vec3.add(this._scene.camera.location, this.cameraVelocity);
  },

  startZoomingOutChaseCamera: function() {
    this.cameraMode = "death";
    this.destinationCameraLocation = vec3.create(this.entity.position);
    this.destinationCameraLocation[1] = 300.0;
    this.playerDeathLocation = this.entity.position;
    this.cameraVelocity = vec3.create([0,0,0]);
  },

  startZoomingBackInChaseCamera: function() {
    this.cameraMode = "chase";
  }
  
};

exports.ChaseCamera = ChaseCamera;
