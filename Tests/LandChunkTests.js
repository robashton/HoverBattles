$(document).ready(function(){
	module("Land chunk tests");

	test("Attaching a land chunk to an entity and rendering it results in no errors", function(){
		var scene = new blah.Scene();

		var heightMap = [256 * 256];
	
		for(var x = 0; x < 256 ; x++){
			for(var y = 0; y < 256; y++) {
				var height = (Math.sin(x) + Math.sin(y)) * 20;
				heightMap[x + (y * 256)] = height;			
			}
		}

		var model = new blah.LandChunk(heightMap, 256, 256, 32, 1);		

		var entity = new blah.Entity("test", model);

		scene.addEntity(entity);

		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		scene.activate(context);
		scene.renderScene();
		scene.deactivate();

	});	
});
