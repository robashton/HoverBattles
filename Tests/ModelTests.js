$(document).ready(function(){
	module("Model tests");

	test("Creating a model results in a new model", function(){
		var model = new blah.Model();
		notEqual(null, model);
	});	

	test("Creating buffers with render context results in no errors", function() {

		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		var model = new blah.Model();
		
		model.setVertices([
			0.0, 0.0, 0, 
			1.0, 0.0, 0, 
			1.0, 1.0, 0, 
			0.0, 1.0, 0
		]);
		model.setIndices([0, 1, 2, 0, 2, 3]);

		model.createBuffers(context);		

	});

	

	
});
