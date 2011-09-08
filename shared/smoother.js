var vec3 = require('./glmatrix').vec3;

var Smoother = {
	_ctor: function() {
		this.hasInitialState = false;
	},
	doLogic: function() {
		if(!this.hasInitialState) return;
		
		var oldpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(this.position, this.oldposition, oldpositionDelta);
		vec3.add(this.networkposition, oldpositionDelta);
	
		var networkpositionDelta = vec3.create([0,0,0]);
		vec3.subtract(this.networkposition, this.position, networkpositionDelta);
		vec3.scale(networkpositionDelta, 0.01);
	
		vec3.add(this.position, networkpositionDelta);
			
		var oldrotationDelta = this.rotationY - this.oldrotationy;	
		this.networkrotationY += oldrotationDelta;
			
		var networkrotationDelta = this.networkrotationY - this.rotationY;
		networkrotationDelta *= 0.1;
		this.rotationY += networkrotationDelta;
		
		this.oldposition = this.position;
		this.oldrotationy = this.rotationY; 
		
	},	
	setSync: function(sync) {
      if(!this.hasInitialState) {
	  		this.position = sync.position;
	  		this.rotationY = sync.rotationY;
			this.hasInitialState = true;
		}

	  this.networkposition = sync.position;
	  this.networkrotationY = sync.rotationY; 
	  this.oldposition = this.position;
	  this.oldrotationy = this.rotationY; 
	}	
};

exports.Smoother = Smoother;