var HovercraftFactory = require('./shared/hovercraftfactory').HovercraftFactory;
var Scene = require('./shared/scene').Scene;
var ResourceManager = require('./shared/resources').ResourceManager;
var Controller = require('./shared/controller').Controller;
var Model = require('./shared/model').Model;
var ServerModelLoader = require('./server/servermodelloader').ServerModelLoader;
var ServerLandChunkModelLoader = require('./server/serverlandchunkloader').ServerLandChunkModelLoader;
var LandscapeController = require('./shared/landscapecontroller').LandscapeController;
var ServerApp = require('./server/application').ServerApp;
var Bounding = require('./maths/bounding');
var mat4 = require('./shared/glmatrix').mat4;


exports["A Hovercraft can be boot-strapped with an application and all that jazz"] = function(test){
    
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    
     var craft = factory.create('player');
     test.ok(craft != null, "Hovercraft was created");
     test.done();
};

exports["Scene can have entities added and requested from it"] = function(test){
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    var craft = factory.create('player');
    
    app.scene.addEntity(craft);
    
    var player = app.scene.getEntity('player');
    
    test.ok(player === craft, "Craft was added to scene");
    test.done();
};

exports["Scene can have entities added and requested from it"] = function(test){
    var app = new ServerApp();
    var factory = new HovercraftFactory(app);
    var craft = factory.create('player');
    
    app.scene.addEntity(craft);
    
    var player = app.scene.getEntity('player');
    
    test.ok(player === craft, "Craft was requested from scene");
    test.done();
};


exports["Logic can be executed against enitities in the scene"] = function(test){
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
        
        test.notDeepEqual(original, hovercraft.position, "Hovercraft was moved with logic");
        test.done();
    }); 
};


exports["Two spheres that overlap test as overlapping"] = function(test) {
    
  var sphereOne = new Bounding.Sphere(5.0, [0,0,0]);
  var sphereTwo = new Bounding.Sphere(5.0, [2,0,0]);
  
  var result = sphereOne.intersectSphere(sphereTwo);
  
  test.ok(result.distance < 0.0, "They overlap");
  test.deepEqual([1,0,0], result.direction, "They overlap with a correct direction vector");
  test.done();
};

exports["Two spheres that don't overlap don't test as overlapping"] = function(test) {
    
  var sphereOne = new Bounding.Sphere(5.0, [0,0,0]);
  var sphereTwo = new Bounding.Sphere(5.0, [11,0,0]);
  
  var result = sphereOne.intersectSphere(sphereTwo);
  
  test.ok(result.distance > 0.0, "They don't overlap");
  test.deepEqual([1,0,0], result.direction, "They don't overlap with a correct direction vector");
  test.done();
};

exports["A transformed sphere doesn't overlap with its parent"] = function(test) {
    
  var sphereOne = new Bounding.Sphere(5.0, [0,0,0]);
  var sphereTwo = sphereOne.translate([11,0,0]);
  
  var result = sphereOne.intersectSphere(sphereTwo);
  
  test.ok(result.distance > 0.0, "They don't overlap");
  test.deepEqual([1,0,0], result.direction, "They don't overlap with a correct direction vector");
  test.done();
};

exports["A transformed sphere can overlap with its parent"] = function(test) {
    
  var sphereOne = new Bounding.Sphere(5.0, [0,0,0]);
  var sphereTwo = sphereOne.translate([2,0,0]);
  console.log(sphereTwo.centre)
    
  var result = sphereOne.intersectSphere(sphereTwo);
  
  test.ok(result.distance < 0.0, "They overlap");
  test.deepEqual([1,0,0], result.direction, "They overlap with a correct direction vector");
  test.done();
};

