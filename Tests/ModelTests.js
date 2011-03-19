$(document).ready(function(){
	module("Model tests");

	test("Creating a model results in a new model", function(){
		var model = new blah.Model([],[]);
		notEqual(null, model);
	});	

	test("Model can create and destroy its own buffers", function() {

		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		var model = blah.Model.Quad();

		model.createBuffers(context);		
		model.destroyBuffers(context);
	});


	test("Model can upload buffers to the gpu", function() {
		var context = new blah.RenderContext();
		context.init('gameFixture');	
		
		var model = blah.Model.Quad();

		model.createBuffers(context);	
		model.uploadBuffers(context);	
		model.destroyBuffers(context);		

	});
	
});
