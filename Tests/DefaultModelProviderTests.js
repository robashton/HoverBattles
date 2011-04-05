$(document).ready(function(){
    module("Default Model Provider Tests");

    
    asyncTest("Provider can load models from javascript files", function(){
        var provider = new blah.DefaultModelProvider();
        
        provider.load('Hovercraft.js', function(model){
            ok(model != null);            
            start();
        });         
    });


    
    test("Provider only handles javascript files", function(){
        var provider = new blah.DefaultModelProvider();
        
        var handlesFile = provider.handles('hovercraft.js');
        var handlesSomethingElse = provider.handles('hovercraft');
        
        equal(handlesFile, true);
        equal(handlesSomethingElse, false);
       
    });

    
	
});
