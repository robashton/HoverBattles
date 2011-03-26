$(document).ready(function(){
	module("Entity tests");

	test("Creating an entity results in a new entity", function(){
		var entity = new blah.Entity();
		notEqual(null, entity);
	});	


	test("Asking an entity for its model returns the set model", function() {
		var model = {};
		var entity = new blah.Entity("blah", model);
		var returnedModel = entity.getModel();
		equal(model, returnedModel);	
	});

	test("Asking an entity for its id returns the id", function() {
		var entity = new blah.Entity("id");
		var returnedId = entity.getId();
		equal("id", returnedId);	
	});
    
    test("Adding additional logic to the entity", function() {
       
       var entity = new blah.Entity("id");
       var one = false;
       var two = false;
       
       entity.attach(function(){
        one = true;    
       });
        
       entity.attach(function(){
        two = true;    
       });
       
       entity.doLogic();
       
       ok(one && two, "Additional logic is executed on doLogic();");       
       
    });
	
	
});
