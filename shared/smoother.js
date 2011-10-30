var vec3 = require('./glmatrix').vec3;

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
		vec3.scale(networkpositionDelta, 0.01);
	
		vec3.add(self.position, networkpositionDelta);
			
		var oldrotationDelta = self.rotationY - self.oldrotationy;	
		self.networkrotationY += oldrotationDelta;
			
		var networkrotationDelta = self.networkrotationY - self.rotationY;
		networkrotationDelta *= 0.1;
		self.rotationY += networkrotationDelta;
		
		self.oldposition = self.position;
		self.oldrotationy = self.rotationY; 
		
	};

	self.setSync = function(sync) {
    if(!self.hasInitialState || sync.force) {
	  		self.position = sync.position;
	  		self.rotationY = sync.rotationY;
			  self.hasInitialState = true;
		}

	  self.networkposition = sync.position;
	  self.networkrotationY = sync.rotationY; 
	  self.oldposition = self.position;
	  self.oldrotationy = self.rotationY; 

	};
};

exports.Smoother = Smoother;
