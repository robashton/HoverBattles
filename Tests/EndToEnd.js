$(document).ready(function(){
	module("End to end integration tests");

	// NOTE: Check for colour in the canvas? This possible? :-)
	test("Rendering a scene with an entity with a model results in no errors", function(){
		var scene = new blah.Scene();
		var model = new blah.Model();
		var entity = new blah.Entity("test", model);

		scene.renderScene();
	});	
});
