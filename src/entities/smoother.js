var vec3 = require('../thirdparty/glmatrix').vec3;

var Smoother = function() {
  var self = this;
  self.hasInitialState = false;
	
	self.doLogic = function() {
		if(!self.hasInitialState) return;
		
		var oldpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(self.position, self.oldposition, oldpositionDelta);
		vec3.add(self.networkposition, oldpositionDelta);
	
		var networkpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(self.networkposition, self.position, networkpositionDelta);
		vec3.scale(networkpositionDelta, 0.0001);
		
		
			
		var oldrotationDelta = self.rotationY - self.oldrotationy;	
		self.networkrotationY += oldrotationDelta;
			
		var networkrotationDelta = self.networkrotationY - self.rotationY;
		networkrotationDelta *= 0.025;
		
		self.rotationY += networkrotationDelta;
    vec3.add(self.position, networkpositionDelta);
    
    // If we nearly fall off the edge of the world and the client thinks we survived
    // The terrain clipping behaviour will get in the way of smoothing, so let's force it
    if(self.position[1] - self.networkposition[1] > 5 && self.networkposition[1] < -5)
      self.position[1] = self.networkposition[1];
		
		self.oldposition = self.position;
		self.oldrotationy = self.rotationY;		
	};

	self.setSync = function(sync) {
    if(!self.hasInitialState || sync.force) {
	  		self.position = sync.position;
	  		self.rotationY = sync.rotationY;
	  	  self.oldposition = self.position;
	      self.oldrotationy = self.rotationY; 
			  self.hasInitialState = true;
		}

	  self.networkposition = sync.position;
	  self.networkrotationY = sync.rotationY; 


	};
};

exports.Smoother = Smoother;
