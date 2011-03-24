$(document).ready(function(){
	module("End to end integration tests");

	// NOTE: Check for colour in the canvas? This possible? :-)
	test("Rendering a scene with an entity with a model results in no errors", function(){
		var scene = new blah.Scene();
		var model = blah.Model.Quad();
		var entity = new blah.Entity("test", model);

		scene.addEntity(entity);

		var context = new blah.RenderContext();

		context.init('gameFixture');
	
		scene.activate(context);
		scene.renderScene();
		scene.deactivate();
	});	
});
