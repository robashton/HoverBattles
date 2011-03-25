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
});
