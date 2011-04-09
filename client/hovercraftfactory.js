var blah = blah || {};

blah.HovercraftFactory = function(app){
  this._app = app;  
};

blah.HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.js");
  var entity = new blah.Entity(id);
  entity.setModel(model);
  //entity.attach(blah.Clipping);
  entity.attach(blah.Hovercraft);
  
  //entity.setBounds([-1000,-1000, -1000], [1000,1000,1000]);
  return entity;
};