var vec3 = require('../thirdparty/glmatrix').vec3;
var mat4 = require('../thirdparty/glmatrix').mat4;
var Entity = require('../core/entity').Entity;

// Landscape controller - loads the land, blah
// Landscape model - the global model containing all the tiny models
// Chunk model - the little models containing the specific data for a model

exports.LandscapeController = function(app, test) {
  var self = this;

  var terrain = null;

  self.getHeightAt = function(x, z) {
     return terrain.getHeightAt(x, z);
  };

  self.render = function(context) {
     terrain.render(context);  
  };

  terrain = app.resources.getModel('terrain');
  terrain.setScene(app.scene);
};


exports.LandscapeController.Create = function(app) {
  var landscape = new Entity("terrain");
  landscape.attach(exports.LandscapeController, [app, 5]);
  app.scene.addEntity(landscape);
};
