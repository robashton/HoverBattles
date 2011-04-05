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
 
});
