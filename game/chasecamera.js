var ChaseCamera = {
  doLogic: function(){      
      var terrain = this._scene.getEntity("terrain");
      
     this._scene.camera.lookAt = this.position;
     
     var cameraTrail = vec3.create(this._velocity);
     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 50);
     vec3.subtract(this.position, cameraTrail, cameraTrail);
     this._scene.camera.location = cameraTrail;
     
     var terrainHeightAtCameraLocation = terrain.getHeightAt(this._scene.camera.location[0], 
                                                             this._scene.camera.location[2]);
                            
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, this.position[1] + 15);
     
     this._scene.camera.location[1] =  cameraHeight;
  }    
};

exports.ChaseCamera = ChaseCamera;