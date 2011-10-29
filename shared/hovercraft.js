var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;

var Hovercraft = function() {
  var self = this;

	self._velocity = vec3.create([0.01,0,0.01]);
  self._decay = 0.97;

  self._left = false;
  self._right = false;
  self._jump = false;
  self._forward = false;
  self._backward = false;

  
  self.getSphere = function() {
      return self._model.boundingSphere.translate(self.position);
  };
  
  self.startForward = function() {
    self._forward = true;  
  };
  
  self.cancelForward = function() {
    self._forward  = false;  
  };
  
  self.startLeft = function() {
      self._left = true;
  };
  
  self.cancelLeft = function() {
      self._left = false;
  };
  
  self.startRight = function() {
    self._right = true;  
  };
  
  self.cancelRight = function() {
      self._right = false;
  };
  
  self.startBackward = function() {
      self._backward = true;
  };
  
  self.cancelBackward = function() {
      self._backward = false;
  };
  
  self.startUp = function() {
      self._jump = true;
  };
  
  self.cancelUp = function() {
      self._jump = false;
  };
  
  self.impulseForward = function() {
      var amount = 0.1;
      var accelerationZ = (-amount) * Math.cos(self.rotationY);
      var accelerationX = (-amount) * Math.sin(self.rotationY);
      var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
      vec3.add(self._velocity, acceleration);
  };
  self.impulseBackward = function() {
      var amount = 0.07;
      var accelerationZ = (amount) * Math.cos(self.rotationY);
      var accelerationX = (amount) * Math.sin(self.rotationY);
      var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
      vec3.add(self._velocity, acceleration);
  };
  self.impulseLeft = function() {
      var amount = 0.07;
      self.rotationY += amount;
  };
  self.impulseRight = function() {
      var amount = 0.07;
      self.rotationY -= amount;
  };
  self.impulseUp = function() {
      var amount = 0.25;
      var terrain = self._scene.getEntity("terrain");
      
      var terrainHeight = terrain.getHeightAt(self.position[0], self.position[2]);
      var heightDelta = self.position[1] - terrainHeight;
      
      if(heightDelta < 20.0) {
          self._velocity[1] += amount;
      }
  };
  
  self.processInput = function() {
      if(self._left) {
          self.impulseLeft();
      }
      else if(self._right) {
          self.impulseRight();
      }
      
      if(self._forward) {
          self.impulseForward();
      } 
      else if( self._backward) {
          self.impulseBackward();
      };
      
      if(self._jump) {
       self.impulseUp();   
      }
  };
  
  self.doLogic = function() {
      self.processInput();
      
      var terrain = self._scene.getEntity("terrain");
      vec3.add(self.position, self._velocity);
                   
      var terrainHeight = terrain == null ? 10 : terrain.getHeightAt(self.position[0], self.position[2]);  
      var heightDelta = self.position[1] - terrainHeight;
      
      if(heightDelta < 0) {
          self.position[1] = terrainHeight;   
      }

	if(Math.abs(self._velocity[1]) < 0.0001)
		self._velocity[1] = 0;
       
       if(heightDelta < 10.0){
             self._velocity[1] += (10.0 - heightDelta) * 0.03;
       }
       self._velocity[1] -= 0.025;              
       vec3.scale(self._velocity, self._decay);

  };
  
  self.updateSync = function(sync) {
    sync.position = self.position;
    sync.rotationY = self.rotationY;
  };
}
         
exports.Hovercraft = Hovercraft;
         

