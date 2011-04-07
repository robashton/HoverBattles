var blah = blah || {};

blah.Hovercraft = {
    _velocity: vec3.create([0.01,0,0.01]),
    _decay: 0.97,
    impulseForward: function(amount) {
        var accelerationZ = (-amount) * Math.cos(this.rotationY);
        var accelerationX = (-amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseBackward: function(amount) {
        var accelerationZ = (amount) * Math.cos(this.rotationY);
        var accelerationX = (amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseLeft: function(amount) {
        this.rotationY += amount;
    },
    impulseRight: function(amount) {
        this.rotationY -= amount;
    },
    doLogic: function() {
       //  var terrain = this._scene.getEntity("terrain");
         vec3.add(this.position, this._velocity);
     /*    
         var terrainHeight =  terrain.getHeightAt(this._entity.position[0], this._entity.position[2]);  
         var heightDelta = this._entity.position[1] - terrainHeight;
         
         if(heightDelta < 10.0){
               this._velocity[1] += (10.0 - heightDelta) * 0.08;
         }
              
         // "Gravity" kicks in too though
         this._velocity[1] -= 0.07;;
              
         // This much is obvious
         this._scene.camera._lookAt = hovercraft.position;
         
         var cameraTrail = vec3.create(this._velocity);
         cameraTrail[1] = 0;
         vec3.normalize(cameraTrail);
         vec3.scale(cameraTrail, 50);
         vec3.subtract(this._entity.position, cameraTrail, cameraTrail);
         this._scene.camera._location = cameraTrail;
         
         var terrainHeightAtCameraLocation = terrain.getHeightAt(this._scene.camera._location[0], this._scene.camera._location[2]);
         var cameraHeight = Math.max(terrainHeightAtCameraLocation + 15, hovercraft.position[1] + 15);
         
         this._scene.camera._location[1] =  cameraHeight;               
         vec3.scale(this._velocity, this._decay);   */
    }    
};