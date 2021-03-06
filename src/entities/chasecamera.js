var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;


exports.ChaseCamera  = function(scene, playerId) {
  var self = this;
  var cameraMode = "chase";
  var entity = null;

  var cameraLocation = vec3.create([0,100,0]);
  var cameraLookAt = vec3.create([0,0,0]);
  var destinationCameraLocation = vec3.create([0,0,0]);
  var destinationCameraLookAt = vec3.create([0,0,0]);
  
  var distanceBack = 20;
  var fixLocation = false;
  var cameraVelocity = vec3.create([0,0,0]);
  var lookAtVelocity = vec3.create([0,0,0]); 

  var includedTargetId = null;
  var desiredCameraLocationIncludingTarget = vec3.create([0,0,0]);
  var desiredCameraLocationBehindPlayer = vec3.create([0,0,0]);
  var offsetBetweenCamerasWhenStoppedTargetting = vec3.create([0,0,0]);
  var percentageTowardsTarget = 0.0;

  var resetDeltas = function() {
    movementDelta = 0.2;
    lookAtDelta = 0.7;
  };
 
  var setTrackedEntity = function(newEntity) {
    entity = newEntity;
  };
 
  var stopTrackingTarget = function() {
    includedTargetId = null;
    vec3.subtract(desiredCameraLocationIncludingTarget, desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting);
  };


  var fixLocationAt = function(position) {
    fixLocation = true;
    destinationCameraLocation = vec3.create(position);
  };

  self.doLogic = function() {
    if(!entity) return;
    workOutWhereTargetIs();
    doLogicAfterAscertainingTarget();
  };

  var updateDesiredCameraPositionIncludingTarget = function() {
    if(!includedTargetId) {
       vec3.add(desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting, desiredCameraLocationIncludingTarget);
       return;
    }
    var target = scene.getEntity(includedTargetId);
    if(!target) return;
    
    var vectorFromTarget = vec3.create([0,0,0]);   
    vec3.subtract(entity.position, target.position, vectorFromTarget);
    vec3.normalize(vectorFromTarget);
    vec3.scale(vectorFromTarget, distanceBack); 
    vec3.add(entity.position, vectorFromTarget, desiredCameraLocationIncludingTarget);       
  };

  var updateDesiredCameraPositionBehindPlayer = function() {    
    var craftRotation = entity.rotationY;
    directionBackZ = distanceBack * Math.cos(craftRotation);
    directionBackX = distanceBack * Math.sin(craftRotation);
    var vectorToDesiredLocation = vec3.create([directionBackX, 0, directionBackZ]);
    vec3.add(entity.position, vectorToDesiredLocation, desiredCameraLocationBehindPlayer);
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
     var terrain = scene.getEntity("terrain");   
     var terrainHeightAtCameraLocation = terrain == null ? 10 : terrain.getHeightAt(location[0], location[2]);

     var terrainSuggestedHeight = getAppropriateCameraElevationFromTerrainHeight(terrainHeightAtCameraLocation);

     location[1] = Math.max(
                      terrainSuggestedHeight, 
                      location[1]
                  );
  };

  var getAppropriateCameraElevationFromTerrainHeight = function(terrainHeight) {
     if(includedTargetId) {
      // Allow the camera to go low when aiming at other players
      return terrainHeight + 1.0;
     } else {
      var entityHeight = entity.position[1] - terrainHeight; 

      // We're probably underground at this point, so skip the terrain check
      if(entityHeight < -20)
        return entity.position[1] + 10;
      else
       return Math.max(entity.position[1] + 3, terrainHeight + 1.0);    
    }
  };

  var workOutWhereTargetIs = function() {   
     var desiredLocation = null;

     updateDesiredCameraPositionIncludingTarget();
     updateDesiredCameraPositionBehindPlayer();
     
     desiredLocation = tweenBetweenCompetingLocations();
     clampLocationToTerrain(desiredLocation);    
     destinationCameraLookAt = vec3.create(entity.position);

     if(!fixLocation)
      destinationCameraLocation = desiredLocation;
  };

  var doLogicAfterAscertainingTarget = function() {
    var directionToWhereWeWantToBe = vec3.create([0,0,0]);
    vec3.subtract(destinationCameraLocation, cameraLocation, directionToWhereWeWantToBe);
    vec3.scale(directionToWhereWeWantToBe, movementDelta , cameraVelocity);
    vec3.add(cameraLocation, cameraVelocity); 

    var directionToWhereWeWantToLookAt = vec3.create([0,0,0]);
    vec3.subtract(destinationCameraLookAt, cameraLookAt, directionToWhereWeWantToLookAt);
    vec3.scale(directionToWhereWeWantToLookAt, lookAtDelta , lookAtVelocity);
    vec3.add(cameraLookAt, lookAtVelocity); 
    scene.camera.lookAt = vec3.create(cameraLookAt);
    scene.camera.location = vec3.create(cameraLocation);
  };
  
  var onEntityTrackingTarget = function(data) {
    if(this.getId() === playerId)
      includedTargetId = data.target.getId();
  };
  
  var onEntityCancelledTrackingTarget = function(data) {
    if(this.getId() === playerId)
      stopTrackingTarget();
  };
  
  var onEntityAdded = function(entity) {
    if(entity.getId() === playerId) {
      resetDeltas();
      fixLocation = false;
      setTrackedEntity(entity);
    }
  };  
  
  var onPlayerHealthZeroed = function(data) {
   if(this.getId() !== playerId) return;
   
    movementDelta = 0.03;
    lookAtDelta = 0.03;
    includedTargetId = null;
    var deathPosition = this.position;

    fixLocationAt([deathPosition[0], deathPosition[1] + 100, deathPosition[1]]);

    scene.withEntity(data.sourceid, function(source) {
      setTimeout(function() {
        setTrackedEntity(source);
      }, 1500);        

      setTimeout(function() {
          fixLocationAt([deathPosition[0], deathPosition[1] + 300, deathPosition[1]]);
      }, 5000);
    });    
  };
  
  scene.on('trackingTarget', onEntityTrackingTarget);
  scene.on('cancelledTrackingTarget', onEntityCancelledTrackingTarget);    
  scene.on('healthZeroed', onPlayerHealthZeroed);
  scene.onEntityAdded(onEntityAdded);
};

exports.ChaseCamera.Type = "ChaseCamera";
exports.ChaseCamera.Create = function(scene, playerId) {
  var entity = new Entity('chase-camera');
  entity.attach(exports.ChaseCamera, [scene, playerId]);
  scene.addEntity(entity);
  return entity;
};
