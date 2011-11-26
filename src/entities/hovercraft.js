var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;

var Hovercraft = function() {
  var self = this;

  self._decay = 0.985;
  var heightDelta = 100.0;
  var terrainHeight = 0.0;

  self.reset = function() {
    self._velocity = vec3.create([0.01,0,0.01]);
    self._left = false;
    self._right = false;
    self._jump = false;
    self._forward = false;
    self._backward = false;
  };
  
  self.reset();
  
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
      var amount = 0.05;
      var accelerationZ = (-amount) * Math.cos(self.rotationY);
      var accelerationX = (-amount) * Math.sin(self.rotationY);
      var acceleration = vec3.create([accelerationX, 0, accelerationZ]);
      vec3.add(self._velocity, acceleration);
  };
  self.impulseBackward = function() {
      var amount = 0.03;
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
      
      if(heightDelta < 20.0 && heightDelta > -5.0) {
          self._velocity[1] += amount;
      }
  };
  
  var processInput = function() {
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

  var adjustPositionByVelocity = function() {
    vec3.add(self.position, self._velocity);
  };

  var updateTerrainVariables = function() {
    var terrain = self._scene.getEntity("terrain");                 
    terrainHeight = terrain == null ? 10 : terrain.getHeightAt(self.position[0], self.position[2]);  
    heightDelta = self.position[1] - terrainHeight;
  };
  
  self.doLogic = function() {
    adjustPositionByVelocity();
    updateTerrainVariables();
    processInput();
    interactWithTerrain();

     self._velocity[1] -= 0.025;              
     vec3.scale(self._velocity, self._decay);

    if(self.position[1] < -90)
      raiseLeftWorldEvent();
  };
 
  var interactWithTerrain = function() {
    if(heightDelta < -5.0) return;
    if(heightDelta < 0.5)
      bounceCraftOffTerrain();     
    clipCraftToTerrain();
  };

  var clipCraftToTerrain = function() {
    if(heightDelta < 5.0)
       self._velocity[1] += (5.0 - heightDelta) * 0.03;
  };

  var bounceCraftOffTerrain = function() {
    self.position[1] = terrainHeight + (0.5 - heightDelta);
    if(self._velocity[1] < 0)
      self._velocity[1] = -self._velocity[1] * 0.25;
  };
  
  self.updateSync = function(sync) {
    sync.position = self.position;
    sync.rotationY = self.rotationY;
  };

  self.projectileHit = function(data) {
    self.raiseServerEvent('healthZeroed', data);
  };

  var raiseLeftWorldEvent = function() {
    self.raiseServerEvent('leftWorld');
  };
}
         
exports.Hovercraft = Hovercraft;
         

