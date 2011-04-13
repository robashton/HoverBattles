var Entity = require('./entity').Entity;
var Hovercraft = require('./hovercraft').Hovercraft;

var HovercraftFactory = function(app){
  this._app = app;  
};

HovercraftFactory.prototype.create = function(id) {
  var model = this._app.resources.getModel("Hovercraft.js");
  var entity = new Entity(id);
  entity.setModel(model);
  //entity.attach(Clipping);
  entity.attach(Hovercraft);
  
  //entity.setBounds([-1000,-1000, -1000], [1000,1000,1000]);
  return entity;
};

exports.HovercraftFactory = HovercraftFactory;