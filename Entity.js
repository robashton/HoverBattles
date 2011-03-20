var blah = blah || {};

blah.Entity = function(id, model){
	this._model = model;
	this._id = id;
	this.position = vec3.create();
	this._scene = null;
};

blah.Entity.prototype.getId = function(){
	return this._id;
};

blah.Entity.prototype.getModel = function(){
	return this._model;
};

blah.Entity.prototype.setScene = function(scene) {
	this._scene = scene;
};
