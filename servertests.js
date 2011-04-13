var assert = require('assert');

var HovercraftFactory = require('./game/hovercraftfactory').HovercraftFactory;
var Scene = require('./game/scene').Scene;
var Controller = require('./game/controller').Controller;
var Model = require('./game/model').Model;

ServerResourceManager = function(app) {
  this._app = app;  
};

ServerResourceManager.prototype.getModel = function(path){
  return new Model();  
};

ServerApp = function(){
  this.resources = new ServerResourceManager(this);
  this.scene = new Scene();
  this.controller = new Controller(this.scene);
};

(function(){
    
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    
     var craft = factory.create('player');
     assert.ok(craft != null, "A Hovercraft can be boot-strapped with an application and all that jazz");
})();