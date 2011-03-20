var blah = blah || {};

blah.Camera = function(location){
	this._location = location;
	this._rotation = vec3.create();
};


blah.Camera.prototype.setLocation = function(location){
	this._location = location;
};

blah.Camera.prototype.getViewMatrix = function(){ 	

	console.log(viewMatrix);
	return viewMatrix;	
};
