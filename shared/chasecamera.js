var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;


var ChaseCamera = function(scene, playerId) {
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
 
  var onEntityAdded = function(entity) {
    if(entity.getId() === playerId) {
      resetDeltas();
      fixLocation = false;
      setTrackedEntity(entity);
    }
  };

  var onEntityRemoved = function(entity) {
    if(entity.getId() === playerId)
      setTrackedEntity(null);
  };

  var setTrackedEntity = function(newEntity) {
    if(entity)
      unhookEntityEvents(entity);
    entity = newEntity;
    if(entity)
      hookEntityEvents(entity);    
  };

  var hookEntityEvents = function(entity) {
    entity.addEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.addEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);    
    entity.addEventHandler('tick', doLogic);
    entity.addEventHandler('healthZeroed', onPlayerHealthZeroed);
  };

  var unhookEntityEvents = function(entity) {
    entity.removeEventHandler('trackingTarget', onEntityTrackingTarget);
    entity.removeEventHandler('cancelledTrackingTarget', onEntityCancelledTrackingTarget);
    entity.removeEventHandler('tick', doLogic);
    entity.removeEventHandler('healthZeroed', onPlayerHealthZeroed);
  };

  var onEntityTrackingTarget = function(data) {
    includedTargetId = data.target.getId();
  };

  var onEntityCancelledTrackingTarget = function(data) {
    includedTargetId = null;
    vec3.subtract(desiredCameraLocationIncludingTarget, desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting);
  };

  var onPlayerHealthZeroed = function(data) {
    movementDelta = 0.03;
    lookAtDelta = 0.03;

    var deathPosition = entity.position;

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

  var fixLocationAt = function(position) {
      fixLocation = true;
      destinationCameraLocation = vec3.create(position);
  };

  var doLogic = function() {
    workOutWhereTargetIs();
    doLogicAfterAscertainingTarget();
  };

  var updateDesiredCameraPositionIncludingTarget = function() {
    if(!includedTargetId) {
       vec3.add(desiredCameraLocationBehindPlayer, offsetBetweenCamerasWhenStoppedTargetting, desiredCameraLocationIncludingTarget);
    } else {
      var vectorFromTarget = vec3.create([0,0,0]);   
      scene.withEntity(includedTargetId, function(target) {
        vec3.subtract(entity.position, target.position, vectorFromTarget);
        vec3.normalize(vectorFromTarget);
        vec3.scale(vectorFromTarget, distanceBack);        
      });
      vec3.add(entity.position, vectorFromTarget, desiredCameraLocationIncludingTarget);
    }
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
      percentageTowardsTarget = Math.min(1.0, percentageTowardsTarget + 0.02);
    else if(percentageTowardsTarget > 0.0)
      percentageTowardsTarget = Math.max(0.0, percentageTowardsTarget - 0.02);

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
     location[1] = Math.max(
                      Math.max(terrainHeightAtCameraLocation + 5, entity.position[1] + 5), 
                      location[1]
                  );
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

  scene.onEntityAdded(onEntityAdded);
};

exports.ChaseCamera = ChaseCamera;
