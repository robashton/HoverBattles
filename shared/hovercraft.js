var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Hovercraft = {
	_ctor: function() {
		this._velocity = vec3.create([0.01,0,0.01]);
	    this._decay = 0.97;

	    this._left = false;
	    this._right = false;
	    this._jump = false;
	    this._forward = false;
	    this._backward = false;
	},
    
    getSphere: function() {
        return this._model.boundingSphere.translate(this.position);
    },
    
    startForward: function() {
      this._forward = true;  
    },
    
    cancelForward: function() {
      this._forward  = false;  
    },
    
    startLeft: function() {
        this._left = true;
    },
    
    cancelLeft: function() {
        this._left = false;
    },
    
    startRight: function() {
      this._right = true;  
    },
    
    cancelRight: function() {
        this._right = false;
    },
    
    startBackward: function() {
        this._backward = true;
    },
    
    cancelBackward:  function() {
        this._backward = false;
    },
    
    startUp: function() {
        this._jump = true;
    },
    
    cancelUp: function() {
        this._jump = false;
    },
    
    
    
    impulseForward: function() {
        var amount = 0.08;
        var accelerationZ = (-amount) * Math.cos(this.rotationY);
        var accelerationX = (-amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseBackward: function() {
        var amount = 0.05;
        var accelerationZ = (amount) * Math.cos(this.rotationY);
        var accelerationX = (amount) * Math.sin(this.rotationY);
        var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
        vec3.add(this._velocity, acceleration);
    },
    impulseLeft: function() {
        var amount = 0.05;
        this.rotationY += amount;
    },
    impulseRight: function() {
        var amount = 0.05;
        this.rotationY -= amount;
    },
    impulseUp: function() {
        var amount = 0.25;
        var terrain = this._scene.getEntity("terrain");
        
        var terrainHeight = terrain.getHeightAt(this.position[0], this.position[2]);
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 20.0) {
            this._velocity[1] += amount;
        }
    },
    
    processInput: function() {
        if(this._left) {
            this.impulseLeft();
        }
        else if(this._right) {
            this.impulseRight();
        }
        
        if(this._forward) {
            this.impulseForward();
        } 
        else if( this._backward) {
            this.impulseBackward();
        };
        
        if(this._jump) {
         this.impulseUp();   
        }
    },
    
    doLogic: function() {
        this.processInput();
        
        var terrain = this._scene.getEntity("terrain");
        vec3.add(this.position, this._velocity);
                     
        var terrainHeight = terrain == null ? 10 : terrain.getHeightAt(this.position[0], this.position[2]);  
        var heightDelta = this.position[1] - terrainHeight;
        
        if(heightDelta < 0) {
            this.position[1] = terrainHeight;   
        }
         
         if(heightDelta < 10.0){
               this._velocity[1] += (10.0 - heightDelta) * 0.03;
         }
         this._velocity[1] -= 0.025;              
         vec3.scale(this._velocity, this._decay);
    },
    
    updateSync: function(sync) {
      sync.velocity = this._velocity;
    },
    
    setSync: function(sync) {
      this._velocity = sync.velocity;
    }
}
         
exports.Hovercraft = Hovercraft;
         

