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
  
  var distanceBack = 20;
  self.fixLocation = false;
  self.cameraVelocity = vec3.create([0,0,0]);
  self.lookAtVelocity = vec3.create([0,0,0]); 

  var lastTargetId = null;
  var includedTargetId = null;
  var desiredCameraLocationIncludingTarget = vec3.create([0,0,0]);
  var desiredCameraLocationBehindPlayer = vec3.create([0,0,0]);
  var percentageTowardsTarget = 0.0;
  
  self.resetDeltas = function() {
    self.movementDelta = 0.2;
    self.lookAtDelta = 0.7;
  };
  self.resetDeltas();

  self.setTrackedEntity= function(entity) {
    if(self.entity)
      unhookEntityEvents(self.entity);
    self.entity = entity;
    if(self.entity)
      hookEntityEvents(self.entity);    
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

  self.doLogic = function(){
    workOutWhereTargetIs();
    doLogicAfterAscertainingTarget();
  };

  var updateDesiredCameraPositionIncludingTarget = function() {
    if(!includedTargetId) return;
    var vectorFromTarget = vec3.create([0,0,0]);   
    self._scene.withEntity(includedTargetId, function(target) {
      vec3.subtract(self.entity.position, target.position, vectorFromTarget);
      vec3.normalize(vectorFromTarget);
      vec3.scale(vectorFromTarget, distanceBack);        
    });
    vec3.add(self.entity.position, vectorFromTarget, desiredCameraLocationIncludingTarget);
  };

  var updateDesiredCameraPositionBehindPlayer = function() {
    var craftRotation = self.entity.rotationY;
    directionBackZ = distanceBack * Math.cos(craftRotation);
    directionBackX = distanceBack * Math.sin(craftRotation);
    var vectorToDesiredLocation = vec3.create([directionBackX, 0, directionBackZ]);
    vec3.add(self.entity.position, vectorToDesiredLocation, desiredCameraLocationBehindPlayer);
  };

  var tweenBetweenCompetingLocations = function() {
    if(includedTargetId && percentageTowardsTarget < 1.0)
      percentageTowardsTarget = Math.min(1.0, percentageTowardsTarget + 0.01);
    else if(percentageTowardsTarget > 0.0)
      percentageTowardsTarget = Math.max(0.0, percentageTowardsTarget - 0.01);

    var targetComponent = vec3.create([0,0,0]);
    var chaseComponent = vec3.create([0,0,0]);
    var totalComponent = vec3.create([0,0,0]);

    vec3.scale(desiredCameraLocationBehindPlayer, 1.0 - percentageTowardsTarget, chaseComponent);
    vec3.scale(desiredCameraLocationIncludingTarget, percentageTowardsTarget, targetComponent);

    vec3.add(chaseComponent, targetComponent, totalComponent);
    return totalComponent;    
  };

  var clampLocationToTerrain = function(location) {
     var terrain = self._scene.getEntity("terrain");   
     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(location[0], location[2]);
     var cameraHeight = Math.max(Math.max(terrainHeightAtCameraLocation + 5, self.entity.position[1] + 2), location[1]);
     location[1] = cameraHeight;
  };

  var workOutWhereTargetIs = function() {   
     var desiredLocation = null;

     updateDesiredCameraPositionIncludingTarget();
     updateDesiredCameraPositionBehindPlayer();
     
     desiredLocation = tweenBetweenCompetingLocations();
     clampLocationToTerrain(desiredLocation);    
     self.destinationCameraLookAt = vec3.create(self.entity.position);

     if(!self.fixLocation)
      self.destinationCameraLocation = desiredLocation;
  };

  var doLogicAfterAscertainingTarget = function() {
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

  var hookEntityEvents = function(entity) {
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  };

  var unhookEntityEvents = function(entity) {
    entity.removeEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.removeEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
  };

  var onEntityTrackingTarget = function(data) {
    includedTargetId = data.target.getId();
  };

  var onEntityCancelledTrackingTarget = function(data) {
    includedTargetId = null;
  };
};

exports.ChaseCamera = ChaseCamera;
