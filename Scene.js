var blah = blah || {};

blah.Scene = function(){
	this._entities = {};
};

blah.Scene.prototype.addEntity = function(entity){
	this._entities[entity.getId()] = entity;
};

blah.Scene.prototype.getEntity = function(id){
	return this._entities[id];
};
