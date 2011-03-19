$(document).ready(function(){
	module("Render context integration tests");

	
	test("Initializing a render context results in no errors", function() {
		var context = new blah.RenderContext();
		context.init('gameFixture');		
	});
	

});
