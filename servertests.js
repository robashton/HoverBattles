var assert = require('assert');

var Scene = require('./client/scene.js').Scene;
var Controller = require('./client/controller.js').Controller;

(function(){
    
    var scene = new Scene();
    var controller = new Controller(scene);
    
    assert.ok(controller != null, "Controller can be created around a scene"); 
    
})();