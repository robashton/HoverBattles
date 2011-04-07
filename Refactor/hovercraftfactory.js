var blah = blah || {};

blah.HovercraftFactory = function(app){
  this._app = app;  
};

blah.HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.js");
  var entity = new blah.Entity(id, model);
  entity.attach(blah.Hovercraft);
  return entity;
};