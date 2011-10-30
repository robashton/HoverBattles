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

  self.movementDelta = 0.2;
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
     
     var craftRotation = self.entity.rotationY;
     var distanceBack = 20;
     var directionBackZ = distanceBack * Math.cos(craftRotation);
     var directionBackX = distanceBack * Math.sin(craftRotation);

     var vectorToDesiredLocation = vec3.create([directionBackX, 0, directionBackZ]);
     var desiredLocation = vec3.create([0,0,0]);
     vec3.add(self.entity.position, vectorToDesiredLocation, desiredLocation);

     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(self.cameraLocation[0], self.cameraLocation[2]);
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 5, self.entity.position[1] + 5);
     
     desiredLocation[1] =  cameraHeight;  
    
     self.destinationCameraLookAt = vec3.create(self.entity.position);

     if(!self.fixLocation)
      self.destinationCameraLocation = desiredLocation;
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
