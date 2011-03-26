$(document).ready(function(){
	module("Land chunk tests");

	test("Attaching a land chunk to an entity and rendering it results in no errors", function(){
		var scene = new blah.Scene();

		var model = new blah.LandChunk(256, 256, 1.4, 1, 0, 0);
		var entity = new blah.Entity("test", model);

		scene.addEntity(entity);

		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		scene.activate(context);
		scene.renderScene();
		scene.deactivate();

	});	
    
    
    test("Height checking with positive chunk", function() {
       var model = new blah.LandChunk(2, 2, 1.4, 1, 0, 0);
       model.getData = function(callback){
            callback(
                {
                   vertices: [],
                   indices: [],
                   colours: [],
                   texturecoords: [],
                   heights: [
                            0, 0,
                            1, 1
                       ]
                });
       };
       
    	var context = new blah.RenderContext();
        context.init('gameFixture');
        
        model.createBuffers(context);
        
        var topLeft = model.getHeightAt(0,0);
        var topRight = model.getHeightAt(0.99, 0);
        var bottomLeft = model.getHeightAt(0, 0.99);
        var bottomRight = model.getHeightAt(0.99, 0.99);
        var middle = model.getHeightAt(0.5, 0.5);
        var bottomRightIsh = model.getHeightAt(0.75, 0.99);
        var somewhere = model.getHeightAt(0.75, 0.75);
        
        equal(topLeft, 0, "Top left");
        equal(topRight, 0, "Top right");
        equal(bottomLeft, 0.99, "bottom left");
        equal(bottomRight, 0.99, "bottom right");
        equal(middle, 0.5, "middle");
        equal(bottomRightIsh, 0.99, "bottomRightIsh");
        equal(somewhere, 0.75, "somewhere");
        
    });
});
