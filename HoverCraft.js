var blah = blah || {};

blah.Hovercraft = function(id, scene) {
    this._model = blah.Model.Quad();
    this._entity = new blah.Entity(id, this._model);
    this._scene = scene;
    
    this._velocity = vec3.create([0,0,0]);
    this._decay = 0.97;
    
    scene.addEntity(this._entity);
    
    var hovercraft = this;
    
    // Attach logic to entity, need to think of a nice tidy way of doing this
    this._entity.impulseForward = function(amount) {
        var accelerationZ = amount * Math.cos(hovercraft._entity.rotationY);
        var accelerationX = amount * Math.sin(hovercraft._entity.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(hovercraft._velocity, acceleration);  
    };
    
    this._entity.impulseBackward = function(amount) {
        var accelerationZ = (-amount) * Math.cos(hovercraft._entity.rotationY);
        var accelerationX = (-amount) * Math.sin(hovercraft._entity.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(hovercraft._velocity, acceleration);
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
    var height =  terrain.getHeightAt(this._entity.position[0], this._entity.position[2]);    
     this._entity.position[1] = height + 0.5;   
     vec3.add(this._entity.position, this._velocity);
     
     // This much is obvious
     this._scene.camera._lookAt = hovercraft.position;
     
     var cameraTrail = vec3.create();
     vec3.normalize(this._velocity, cameraTrail);
     vec3.scale(cameraTrail, 20);
     
     vec3.subtract(this._entity.position, cameraTrail, cameraTrail);
     
     
     this._scene.camera._location = cameraTrail;
     this._scene.camera._location[1] = terrain.getHeightAt(this._scene.camera._location[0], this._scene.camera._location[2]) + 5;
               
    vec3.scale(this._velocity, this._decay);
     
     
};