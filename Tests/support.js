var blah = blah || {};

blah.DummyTerrain  = {
    getId: function() { return 'terrain'; },
    getHeightAt: function(x,z) { return 0; },
    doLogic: function(){},
    render: function(context) {},
    setScene: function(scene) {}
};