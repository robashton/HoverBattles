var blah = blah || {};

blah.Camera = function(location){
	this._location = location;
	this._rotation = vec3.create();
};


blah.Camera.prototype.setLocation = function(location){
	this._location = location;
};

blah.Camera.prototype.getViewMatrix = function(){ 	
	var viewMatrix = mat4.create();
	mat4.identity(viewMatrix);

	mat4.translate(viewMatrix,
		[
			-this._location[0],
			-this._location[1],
			-this._location[2]
		]);

	return viewMatrix;	
};
