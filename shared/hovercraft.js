var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Hovercraft = {
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
    impulseUp: function(amount) {
        var terrain = this._scene.getEntity("terrain");
        
        var terrainHeight = terrain.getHeightAt(this.position[0], this.position[2]);
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 20.0) {
            this._velocity[1] += amount;
        }
    },
    doLogic: function() {
        var terrain = this._scene.getEntity("terrain");
        vec3.add(this.position, this._velocity);
                     
        var terrainHeight =  terrain.getHeightAt(this.position[0], this.position[2]);  
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 0) {
            this.position[1] = terrainHeight;   
        }
         
         if(heightDelta < 10.0){
               this._velocity[1] += (10.0 - heightDelta) * 0.08;
         }
         this._velocity[1] -= 0.07;              
         vec3.scale(this._velocity, this._decay);    
         
    }
}
         
exports.Hovercraft = Hovercraft;
         

