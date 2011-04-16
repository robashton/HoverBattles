var assert = require('assert');

var HovercraftFactory = require('./shared/hovercraftfactory').HovercraftFactory;
var Scene = require('./shared/scene').Scene;
var ResourceManager = require('./shared/resources').ResourceManager;
var Controller = require('./shared/controller').Controller;
var Model = require('./shared/model').Model;
var ServerModelLoader = require('./server/servermodelloader').ServerModelLoader;
var ServerLandChunkModelLoader = require('./server/serverlandchunkloader').ServerLandChunkModelLoader;
var LandscapeController = require('./shared/landscapecontroller').LandscapeController;
var ServerApp = require('./server/application').ServerApp;

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
    var factory = new HovercraftFactory(app);
    var hovercraft = factory.create("player");
    var landscape = new LandscapeController(app);
    app.scene.addEntity(hovercraft);
    app.scene.doLogic();
            
    app.resources.onAllAssetsLoaded(function(){    
        var original = vec3.create(hovercraft.position);               
        
        hovercraft.impulseForward(0.1);
        hovercraft.impulseForward(-0.1);                
        hovercraft.impulseLeft(0.1);
        hovercraft.impulseRight(0.1);
        
        app.scene.doLogic();       
        console.log("WOOT");
    });
})();


console.log('Tests completed');