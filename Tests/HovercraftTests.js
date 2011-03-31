$(document).ready(function(){
    module("Hovercraft");
	
	test("Creating a hovercraft around a scene", function() {
        var scene = new blah.Scene();
        var hovercraft = new blah.Hovercraft("h1", scene);
        
        ok(scene.getEntity("h1"), "An Entity added to the scene with an appropriate id");
        
	});

});
