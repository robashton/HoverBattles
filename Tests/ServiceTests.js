$(document).ready(function(){
	module("Service tests");

	asyncTest("Requesting a chunk of land results in some data being returned", function(){
		blah.Services.getLandChunk(128, 128, 1, 5, 0, 0, function(data) {
			ok(data != null);			
			start();
		});		
	});
	
	asyncTest("Requesting a chunk of land results in the maximum height being honoured", function(){
		blah.Services.getLandChunk(128, 128, 1, 5, 0, 0, function(data) {
			
			var allHeightsAreLessThanExpected = true;
			for(var v = 0 ; v < data.vertices.length; v+=3) {
				var height = data.vertices[v + 1];
				if(height > 5) { 
					allHeightsAreLessThanExpected = false;
					break;
				}
			}
			ok(allHeightsAreLessThanExpected);			
			start();
		});
	});

});
