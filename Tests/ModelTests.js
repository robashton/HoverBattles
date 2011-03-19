$(document).ready(function(){
	module("Model tests");

	test("Creating a model results in a new model", function(){
		var model = new blah.Model([],[]);
		notEqual(null, model);
	});	

	test("Model can create and destroy its own buffers", function() {

		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		var model = new blah.Model(
			[
			0.0, 0.0, 0, 
			1.0, 0.0, 0, 
			1.0, 1.0, 0, 
			0.0, 1.0, 0
			],
			[0, 1, 2, 0, 2, 3]
		);

		model.createBuffers(context);		
		model.destroyBuffers(context);
	});

	

	
});
