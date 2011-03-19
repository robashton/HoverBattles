var blah = blah || {};

blah.Entity = function(id, model){
	this._model = model;
	this._id = id;
	this._position = vec3.create();
};

blah.Entity.prototype.getId = function(){
	return this._id;
};

blah.Entity.prototype.getModel = function(){
	return this._model;
};
