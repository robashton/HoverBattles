$(document).ready(function(){
    module("End to end tests");

 
    asyncTest("We can bootstrap an application around the canvas with a valid context", function(){
       var app = new blah.Application('gameCanvas', '../');
       app.init(function(){
            ok(app.context != null, "Context is created");
            ok(app.scene != null, "Scene is created");
            start();
        });     
    });	
    
    asyncTest("Entity added to scene is dealt with accordingly", function(){ 
        var app = new blah.Application('gameCanvas', '../');
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
        var app = new blah.Application('gameCanvas', '../');
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
        var app = new blah.Application('gameCanvas', '../');
        app.init(function(){
           var model = new blah.Model({
              vertices: [],
              indices: []
           });
            start();
            equal("default", model.getProgram());
        });        
    });
    
    asyncTest("Model with vertices, indices and colour uses the colour shader", function(){
        var app = new blah.Application('gameCanvas', '../');
        app.init(function(){
           var model = new blah.Model({
              vertices: [],
              indices: [],
              colours: []
           });
           start();
           equal("colour", model.getProgram());
        });
    });
    
    asyncTest("Model with vertices, indices and tex coords uses the texture shader", function(){
        var app = new blah.Application('gameCanvas', '../');
        app.init(function(){
           var model = new blah.Model({
              vertices: [],
              indices: [],
              texCoords: []
           });
            start();
            equal("texture", model.getProgram());
        });
    });
    
    asyncTest("Default Texture Loader can load textures from server", function(){
         var app = new blah.Application('gameCanvas', '../');
         app.init(function(){        
            var loader = new blah.DefaultTextureLoader(app);
            var texture = loader.load('/textures/hovercraft.jpg', function(){
                ok(true, "Texture finished loading from server");
                start();   
            });
            ok(texture, "Texture object was returned from load method");
        });
    });

    asyncTest("Resource manager can return resources", function(){
         var app = new blah.Application('gameCanvas', '../');
         app.init(function(){
            start();
            
            var resources = new blah.ResourceManager(app);
            
            var model = resources.getModel("Hovercraft.js");
            var texture = resources.getTexture("/textures/hovercraft.jpg");
            
            ok(model != null, "Model was loaded");
            ok(texture != null, "Texture was loaded");
        });
    });
      
    asyncTest("Default Model Loader can load models from server with appropriate texture", function(){
         var app = new blah.Application('gameCanvas', '../');
         app.init(function(){
             var resources = new blah.ResourceManager(app);
            var loader = new blah.DefaultModelLoader(resources);
            var model = loader.load('Hovercraft.js', function(){
                ok(true, "Model finished loading from server");
                ok(model._texture, "Model has texture");
                start();
            });
            
            ok(model, "Model object was returned from load method");
        });
    });
 
    asyncTest("Land chunk model loader knows what it's for", function(){
        var app = new blah.Application('gameCanvas', '../');
        app.init(function() {
            var resources = new blah.ResourceManager(app);
            var loader = new blah.LandChunkModelLoader(resources);
            
            var handles = loader.handles('chunk_');
            var nothandles = loader.handles('Something');
            
            ok(handles == true, "Loader handles chunk requests");
            ok(nothandles == false, "Loader disregards other things");
            start();
        });        
    });
    
    asyncTest("Land chunk model loader can load a chunk from the server", function(){
        var app = new blah.Application('gameCanvas', '../');
        app.init(function() {
            var resources = new blah.ResourceManager(app);
            var loader = new blah.LandChunkModelLoader(resources);
                
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
        var app = new blah.Application('gameCanvas', '../');
        app.init(function() {
            var resources = new blah.ResourceManager(app);
            var loader = new blah.LandChunkModelLoader(resources);
            resources.addModelLoader(loader);
            
            var data = 'chunk_' + JSON.stringify({
               height: 32,
               width: 32,
               maxHeight: 32,
               scale: 1,
               x: 1,
               y: 1               
            });
            
            var model = resources.getModel(data);            
            ok(model != null, "Model was returned from resource provider");
            start();            
        });        
    });
    
    asyncTest("We can wait for all assets to be loaded from the resource manager", function(){
        var app = new blah.Application('gameCanvas', '../');
        app.init(function() {
            var resources = new blah.ResourceManager(app);            
            var model = resources.getModel("Hovercraft.js");
            var texture = resources.getTexture("/textures/hovercraft.jpg");
            
            resources.onAllAssetsLoaded(function(){
                ok(model._vertexBuffer != null, "Model is fully loaded");
                ok(texture._data != null, "Texture is fully loaded");
                start();
            });          
        });        
    });
    
    
 
});
