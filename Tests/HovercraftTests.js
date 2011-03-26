$(document).ready(function(){
    module("Hovercraft");
	
	test("Creating a hovercraft around a scene", function() {
        var scene = new blah.Scene();
        var hovercraft = new blah.Hovercraft("h1", scene);
        
        ok(scene.getEntity("h1"), "An Entity added to the scene with an appropriate id");
        
	});

    test("Hovercraft uses terrain height to set its own height", function(){ 
        var scene = new blah.Scene();
        var terrain = {
            getId: function() { return "terrain"; },
            setScene: function(scene) {},
            getHeightAt: function(x, z) {
                return x + z;   
            }
        };
        scene.addEntity(terrain);
        
        var hovercraft = new blah.Hovercraft("h1", scene);
        hovercraft._entity.position[0] = 2;
        hovercraft._entity.position[2] = 4;
        
        hovercraft.doLogic();
 
        var height = hovercraft._entity.position[1];
        
        equal(height, 6.5);      
        
    });

});
