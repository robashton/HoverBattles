$(document).ready(function(){
	module("Camera tests");

	test("Camera can construct and return a view matrix", function(){
		var camera = new blah.Camera([0,0,0]);
		var viewMatrix = camera.getViewMatrix();
		notEqual(null, viewMatrix);
	});	

	
	
});
