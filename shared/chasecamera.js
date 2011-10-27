var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var ChaseCamera = function() {
  var self = this;
  self.cameraMode = "chase";
  self.entity = null;

  self.cameraLocation = vec3.create([0,100,0]);
  self.cameraLookAt = vec3.create([0,0,0]);
  self.destinationCameraLocation = vec3.create([0,0,0]);
  self.destinationCameraLookAt = vec3.create([0,0,0]);

  self.movementDelta = 0.1;
  self.lookAtDelta = 0.7;
  self.fixLocation = false;

  self.cameraVelocity = vec3.create([0,0,0]);
  self.lookAtVelocity = vec3.create([0,0,0]); 

  self.setTrackedEntity= function(entity) {
    self.entity = entity;
  };

  self.fixLocationAt= function(position) {
      self.fixLocation = true;
      self.destinationCameraLocation = vec3.create(position);
  };

  self.unfixLocation= function() {
      self.fixLocation = false;
  };

  self.setMovementDelta= function(delta) {
    self.movementDelta = delta;
  };
  
  self.setLookAtDelta= function(delta) {
    self.lookAtDelta = delta;
  };

  self.doLogic= function(){      
    self.workOutWhereTargetIs();
    self.doLogicAfterAscertainingTarget();
  };

  self.workOutWhereTargetIs= function() {
     var terrain = self._scene.getEntity("terrain");      
     var cameraTrail = vec3.create(self.entity._velocity);

     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 25);
     vec3.subtract(self.entity.position, cameraTrail, cameraTrail);

     var desiredCameraLocation = cameraTrail;

     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(self._scene.camera.location[0], 
                                                             self._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, self.entity.position[1] + 10);
     
     desiredCameraLocation[1] =  cameraHeight;  
    

     self.destinationCameraLookAt = vec3.create(self.entity.position);

     if(!self.fixLocation)
      self.destinationCameraLocation = desiredCameraLocation;
  };

  self.doLogicAfterAscertainingTarget= function() {
    var directionToWhereWeWantToBe = vec3.create([0,0,0]);
    vec3.subtract(self.destinationCameraLocation, self.cameraLocation, directionToWhereWeWantToBe);
    vec3.scale(directionToWhereWeWantToBe, self.movementDelta , self.cameraVelocity);
    vec3.add(self.cameraLocation, self.cameraVelocity); 

    var directionToWhereWeWantToLookAt = vec3.create([0,0,0]);
    vec3.subtract(self.destinationCameraLookAt, self.cameraLookAt, directionToWhereWeWantToLookAt);
    vec3.scale(directionToWhereWeWantToLookAt, self.lookAtDelta , self.lookAtVelocity);
    vec3.add(self.cameraLookAt, self.lookAtVelocity); 

    self._scene.camera.lookAt = vec3.create(self.cameraLookAt);
    self._scene.camera.location = vec3.create(self.cameraLocation);
  };

};

exports.ChaseCamera = ChaseCamera;
