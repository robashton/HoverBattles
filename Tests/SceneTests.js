$(document).ready(function(){
	module("Scene tests");

	test("Creating a scene results in a new scene", function(){
		var scene = new blah.Scene();
		notEqual(null, scene);
	});	

	test("Adding an entity to a scene results in that entity being present in that scene", function(){
		var scene = new blah.Scene();
		var entity = new blah.Entity("id");
		scene.addEntity(entity);
		var retrievedEntity = scene.getEntity("id");

		equal(entity, retrievedEntity);		
	});
	
});
