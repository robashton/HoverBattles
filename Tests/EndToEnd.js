$(document).ready(function(){
	module("End to end integration tests");

	// NOTE: Check for colour in the canvas? This possible? :-)
	test("Rendering a ton of objects results in no errors", function(){
		var scene = new blah.Scene();
		var model = new blah.Model();
		var entity = new blah.Entity("test", model);

		scene.renderScene();
	});	
});
