var blah = blah || {};

blah.Hovercraft = function(id, scene) {
     this._model = new blah.Model({
         vertices: BlenderExport.Hovercraft.vertices,
         indices: BlenderExport.Hovercraft.indices,
         texCoords: BlenderExport.Hovercraft.texCoords
     },
     "texture");

    this._model._textureName = "/textures/hovercraft.jpg";

     
    this._entity = new blah.Entity(id, this._model);
    this._scene = scene;
    
    this._velocity = vec3.create([0.01,0,0.01]);
    this._decay = 0.97;
    this._cameraDelta = 0;
    
    scene.addEntity(this._entity);
    
    var hovercraft = this;
    
    // Attach logic to entity, need to think of a nice tidy way of doing this
    this._entity.impulseForward = function(amount) {
        var accelerationZ = (-amount) * Math.cos(hovercraft._entity.rotationY);
        var accelerationX = (-amount) * Math.sin(hovercraft._entity.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(hovercraft._velocity, acceleration);  
    };
    
    this._entity.impulseBackward = function(amount) {
        var accelerationZ = (amount) * Math.cos(hovercraft._entity.rotationY);
        var accelerationX = (amount) * Math.sin(hovercraft._entity.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(hovercraft._velocity, acceleration);
    };
    
    this._entity.cameraVertical = function(amount) {
        hovercraft._cameraDelta += amount;;
    };
    
    this._entity.impulseLeft = function(amount) {
        hovercraft._entity.rotationY += amount;
    };
    
    this._entity.impulseRight = function(amount) {
       hovercraft._entity.rotationY -= amount;
    };
    
    this._entity.attach(function(){
       hovercraft.doLogic(); 
    });
};

blah.Hovercraft.prototype.doLogic = function(){
    var terrain = this._scene.getEntity("terrain");
    var hovercraft = this._entity;
    
    // So we'll get the height at the current entity point
     vec3.add(this._entity.position, this._velocity);
     
     var terrainHeight =  terrain.getHeightAt(this._entity.position[0], this._entity.position[2]);  
     var heightDelta = this._entity.position[1] - terrainHeight;
     
     if(heightDelta < 1.0){
           this._velocity[1] += (1.0 - heightDelta);
     }
          
     // "Gravity" kicks in too though
     this._velocity[1] -= 0.07;;
          
     // This much is obvious
     this._scene.camera._lookAt = hovercraft.position;
     
     var cameraTrail = vec3.create(this._velocity);
     cameraTrail[1] = 0;
     vec3.normalize(cameraTrail);
     vec3.scale(cameraTrail, 15);
     vec3.subtract(this._entity.position, cameraTrail, cameraTrail);
     this._scene.camera._location = cameraTrail;
     
     var terrainHeightAtCameraLocation = terrain.getHeightAt(this._scene.camera._location[0], this._scene.camera._location[2]);
     var cameraHeight = Math.max(terrainHeightAtCameraLocation + 5, hovercraft.position[1] + 5);
     
     this._scene.camera._location[1] =  cameraHeight;               
     vec3.scale(this._velocity, this._decay);
     
};