var assert = require('assert');

var HovercraftFactory = require('./shared/hovercraftfactory').HovercraftFactory;
var Scene = require('./shared/scene').Scene;
var ResourceManager = require('./shared/resources').ResourceManager;
var Controller = require('./shared/controller').Controller;
var Model = require('./shared/model').Model;

ServerResourceManager.prototype.getModel = function(path){
  return new Model();  
};

ServerApp = function(){
  this.resources = ResourceManager(this);
  this.scene = new Scene();
  this.controller = new Controller(this.scene);
  
  this.resources.clearModelProviders();
  this.resources.clearTextureProviders();  
  this.resources.add

};

(function(){
    
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    
     var craft = factory.create('player');
     assert.ok(craft != null, "A Hovercraft can be boot-strapped with an application and all that jazz");
})();

(function(){
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    var craft = factory.create('player');
    
    app.scene.addEntity(craft);
    
    var player = app.scene.getEntity('player');
    
    assert.ok(player === craft, "Scene can have entities added and requested from it");    
})();

(function(){
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    var craft = factory.create('player');
    
    app.scene.addEntity(craft);
    
    var player = app.scene.getEntity('player');
    
    assert.ok(player === craft, "Scene can have entities added and requested from it");    
})();


(function(){
    var app = new ServerApp();
    var landscape = new LandscapeController(app);
    var craft = factory.create('player');
    
    app.scene.addEntity(craft);
    
    var controller = new Controller(app.scene);
    controller.tick();    
    
})();



console.log('Tests completed');