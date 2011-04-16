// HAhaha take that .NET developers, I know these tests are highly integrated and the code not TDDd
// And I know that these tests require a web server and all sorts to function
// But I don't care, because they're delivering me a big pile of VALUE
// Also, so much code is dependent on webgl and assets from the server that it's just too much effort to
// think about splitting out at all

$(document).ready(function(){$app(function(){
    module("End to end tests");
 
    asyncTest("We can bootstrap an application around the canvas with a valid context", function(){
       var app = new blah.Application('gameCanvas');
       app.init(function(){
            ok(app.context != null, "Context is created");
            ok(app.scene != null, "Scene is created");
            start();
        });     
    });	
    
    asyncTest("Entity added to scene is dealt with accordingly", function(){ 
        var app = new blah.Application('gameCanvas');
        app.init(function(){
            var scene = app.scene;
            var addedScene = null;
            var logicExecuted = false;
            scene.addEntity({
                getId: function() { return 'id'; },
                setScene: function(scene) { addedScene = scene; },
                doLogic: function(){
                    logicExecuted = true;
               }
            });
            start();
            
            app.tick();
            ok(addedScene === scene, "Scene was set on entity");
            ok(logicExecuted, "Logic was executed");
        });
    });
    
    asyncTest("Entity added to scene is rendered by the scene", function(){ 
        var app = new blah.Application('gameCanvas');
        app.init(function(){
            var scene = app.scene;
            var setContext = null;
            
            scene.addEntity({
                getId: function() { return 'id'; },
                setScene: function(scene) {},
                doLogic: function(){},
                render: function(context) {
                    setContext = context;    
                }
            });
            start();
            app.render();            
            ok(setContext === app.context, "Context was passed to entity for rendering");           
        });
    });
    
    asyncTest("Model with unknown combination uses the default shader", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function(){
           var model = new Model({
              vertices: [],
              indices: []
           });
            start();
            equal("default", model.getProgram());
        });        
    });
    
    asyncTest("Model with vertices, indices and colour uses the colour shader", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function(){
           var model = new Model({
              vertices: [],
              indices: [],
              colours: []
           });
           start();
           equal("colour", model.getProgram());
        });
    });
    
    asyncTest("Model with vertices, indices and tex coords uses the texture shader", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function(){
           var model = new Model({
              vertices: [],
              indices: [],
              texCoords: []
           });
            start();
            equal("texture", model.getProgram());
        });
    });
    
    asyncTest("Default Texture Loader can load textures from server", function(){
         var app = new blah.Application('gameCanvas');
         app.init(function(){        
            var loader = new DefaultTextureLoader(app);
            var texture = loader.load('/textures/hovercraft.jpg', function(){
                ok(true, "Texture finished loading from server");
                start();   
            });
            ok(texture, "Texture object was returned from load method");
        });
    });

    asyncTest("Resource manager can return resources", function(){
         var app = new blah.Application('gameCanvas');
         app.init(function(){
            start();
            
            var resources = new ResourceManager(app);
            resources.setTextureLoader(new DefaultTextureLoader(app));
            resources.addModelLoader(new DefaultModelLoader(resources));
            
            var model = resources.getModel("Hovercraft.js");
            var texture = resources.getTexture("/textures/hovercraft.jpg");
            
            ok(model != null, "Model was loaded");
            ok(texture != null, "Texture was loaded");
        });
    });
      
    asyncTest("Default Model Loader can load models from server with appropriate texture", function(){
         var app = new blah.Application('gameCanvas');
         app.init(function(){
            var resources = new ResourceManager(app);
            resources.setTextureLoader(new DefaultTextureLoader(app));
            var loader = new DefaultModelLoader(resources);
            var model = loader.load('Hovercraft.js', function(){
                ok(true, "Model finished loading from server");
                ok(model._texture, "Model has texture");
                start();
            });
            
            ok(model, "Model object was returned from load method");
        });
    });
 
    asyncTest("Land chunk model loader knows what it's for", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var loader = new LandChunkModelLoader(app.resources);
            
            var handles = loader.handles('chunk_');
            var nothandles = loader.handles('Something');
            
            ok(handles == true, "Loader handles chunk requests");
            ok(nothandles == false, "Loader disregards other things");
            start();
        });        
    });
    
    asyncTest("Land chunk model loader can load a chunk from the server", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var loader = new LandChunkModelLoader(app.resources);
                
            var data = 'chunk_' + JSON.stringify({
               height: 32,
               width: 32,
               maxHeight: 32,
               scale: 1,
               x: 1,
               y: 1               
            });
            
            var model = loader.load(data, function(){
                ok(true, "Model finished loading from server");
                start();
            });          
            ok(model != null, "Model was returned from land chunk");
        });        
    });
    
    asyncTest("Land chunk model can be loaded and activated from resource manager", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var loader = new LandChunkModelLoader(app.resources);
            app.resources.addModelLoader(loader);
            
            var data = 'chunk_' + JSON.stringify({
               height: 32,
               width: 32,
               maxHeight: 32,
               scale: 1,
               x: 1,
               y: 1               
            });
            
            var model = app.resources.getModel(data);            
            ok(model != null, "Model was returned from resource provider");
            start();            
        });        
    });
    
    asyncTest("We can wait for all assets to be loaded from the resource manager", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {      
            
            var model = app.resources.getModel("Hovercraft.js");
            var texture = app.resources.getTexture("/textures/hovercraft.jpg");
            
            app.resources.onAllAssetsLoaded(function(){
                ok(model._vertexBuffer != null, "Model is fully loaded");
                ok(texture._data != null, "Texture is fully loaded");
                start();
            });          
        });        
    });
        
    asyncTest("A loaded model can be rendered with a context", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {       
            var model = app.resources.getModel("Hovercraft.js");
            var texture = app.resources.getTexture("/textures/hovercraft.jpg");
            
            app.resources.onAllAssetsLoaded(function(){
                app.context.setActiveProgram(model.getProgram());
                model.upload(app.context);
                model.render(app.context);
                ok(true, "Model rendered with no errors");
                start();
            });          
        });        
    });
 
 
    asyncTest("A loaded land chunk can be rendered with a context", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var loader = new LandChunkModelLoader(app.resources);
            app.resources.addModelLoader(loader);
            
            var data = 'chunk_' + JSON.stringify({
               height: 32,
               width: 32,
               maxHeight: 32,
               scale: 1,
               x: 1,
               y: 1               
            });
            
            var model = app.resources.getModel(data);
            
            app.resources.onAllAssetsLoaded(function(){
                app.context.setActiveProgram(model.getProgram());
                model.upload(app.context);
                model.render(app.context);
                ok(true, "Model rendered with no errors");
                start();
            });          
        });        
    });

    asyncTest("A Landscape controller will do all sorts of stuff with terrain (mammoth test)", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            
            var landscapeController = new LandscapeController(app);
            app.scene.addEntity({
               getId: function(){ return "player"; },
               position: [0,0,0],
               doLogic: function(){},
               render: function(){},
               setScene: function() {}
            });
            
            app.tick();
                        
            app.resources.onAllAssetsLoaded(function(){       
                var count = 0;
                for(i in app.scene._entities) count++;
                
                ok(count > 6, "Landscape loaded entities into scene");  
                
                var height = landscapeController.getHeightAt(0,0);
                
                ok(height != undefined, "Height can be retrieved from landscape controller");     
                
                app.render();
                start();
            });         
        });        
    });    
    
    asyncTest("A Hovercraft can be added to the scene and rendered without too much fuss", function() {
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var factory = new HovercraftFactory(app);
            var hovercraft = factory.create("player");
            app.scene.addEntity(blah.DummyTerrain);
            app.scene.addEntity(hovercraft);
            
            app.resources.onAllAssetsLoaded(function(){                
                ok(app.scene.getEntity("player"), "Hovercraft was added to scene");                
                app.render();
                start();
            });         
        });
    });
    
    asyncTest("A hovercraft has basic hovercraft functionality (smoke test)", function() {
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var factory = new HovercraftFactory(app);
            var hovercraft = factory.create("player");
            app.scene.addEntity(blah.DummyTerrain);
            app.scene.addEntity(hovercraft);
            
            app.resources.onAllAssetsLoaded(function(){    
                var original = vec3.create(hovercraft.position);               
                
                hovercraft.impulseForward(0.1);
                hovercraft.impulseForward(-0.1);                
                hovercraft.impulseLeft(0.1);
                hovercraft.impulseRight(0.1);
                
                app.tick();                
                notEqual(original, hovercraft.position, "Hovercraft was moved by controller methods");
                start();
            });         
        }); 
    });
    
    asyncTest("We can attach a chase camera to the hovercraft, hurrah!", function() {
        var app = new blah.Application('gameCanvas');
        app.init(function() {
            var factory = new HovercraftFactory(app);
            var hovercraft = factory.create("player");
            app.scene.addEntity(blah.DummyTerrain);
            app.scene.addEntity(hovercraft);
            hovercraft.attach(ChaseCamera);
            
            app.resources.onAllAssetsLoaded(function(){    
                var original = vec3.create(app.scene.camera.location);               
                
                hovercraft.impulseForward(0.1);
                hovercraft.impulseForward(-0.1);                
                hovercraft.impulseLeft(0.1);
                hovercraft.impulseRight(0.1);
                
                app.tick();                
                notEqual(original, app.scene.camera.location, "Camera was moved when hovercraft moved");
                start();
            });         
        }); 
    });
    
    module("Component checks");
    
    asyncTest("An entity can be constrained with a clipping component", function(){
        var app = new blah.Application('gameCanvas');
        app.init(function() {
           var entity = new Entity("id");
           entity.attach(Clipping);
           entity.setBounds([0,0,0], [10,10,10]);
           
           entity.position = [-10,-5,-2];
           entity._velocity = [-1, -2, -3];
           entity.doLogic();
           
           same(entity.position, [0,0,0], "Entity can't go below min");
           same(entity._velocity, [0,0,0], "Entity has velocity halted on going below min");       
                  
           entity.position = [20,20,20];
           entity._velocity = [1, 2, 3];
           entity.doLogic();
           
           same(entity.position, [10,10,10], "Entity can't go above max");
           same(entity._velocity, [0,0,0], "Entity has velocity halted on going above max");
           start();
        });        
    });
    
    
    module("Multiplayer tests");
        
    
    asyncTest("Two players connecting to the server", function(){

         var app1 = new blah.Application('gameCanvas');
         var app2 = new blah.Application('gameCanvas');
         
         app1.init(function() { app2.init(function() {         
             var clientOne = new ClientCommunication(app1);
             var clientTwo = new ClientCommunication(app2);
             
             var otherStarted = false;             
             var intervalId = setInterval(function(){
                 
                 if(clientOne.started && clientTwo.started){
                     ok(clientOne.craft != null, "Client one was given a hovercraft when starting");
                     ok(clientTwo.craft != null, "Client two was given a hovercraft when starting");              
                                         
                     var clientOneId = clientOne.craft.getId();
                     var clientTwoId = clientTwo.craft.getId();
                     
                     var clientTwoEntityFromAppOne = app1.scene.getEntity(clientTwoId);
                     var clientOneEntityFromAppTwo = app2.scene.getEntity(clientOneId);
                     
                     ok(clientOneEntityFromAppTwo != null, "Client one has an entity in client two's world");
                     ok(clientTwoEntityFromAppOne != null, "Client two has an entity in client one's world");
                                         
                     clearInterval(intervalId);
                     start();
                 }
            }, 300);      
         })});        
    });
 
}); });
