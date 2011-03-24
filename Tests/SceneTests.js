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

		ok(entity === retrievedEntity);		
	});

	test("Removing an entity from the scene results in the entity not being there any more", function(){
		var scene = new blah.Scene();
		var entity = new blah.Entity("id");
		scene.addEntity(entity);
		scene.removeEntity(entity);

		var entity = scene.getEntity("id");
		ok(entity === undefined);
		
	});

	test("Removing an entity from the scene results in the entity being notified", function(){
		var scene = new blah.Scene();
		var entity = new blah.Entity("id");
		scene.addEntity(entity);
		scene.removeEntity(entity);

		ok(entity._scene === undefined);
	});

	test("Adding an entity to a scene reuslts in that entity being given a reference to that scene", function() {
		var scene = new blah.Scene();
		var entity = new blah.Entity("id");

		scene.addEntity(entity);

	 	ok(entity._scene === scene);

	});
	
});
