ResourceManager = require('../shared/resources').ResourceManager;
Scene = require('../shared/scene').Scene;
Controller = require('../shared/controller').Controller;

ServerModelLoader = require('./servermodelloader').ServerModelLoader;
ServerLandChunkModelLoader = require('./serverlandchunkloader').ServerLandChunkModelLoader;

ServerApp = function(){
  this.resources = new ResourceManager(this);
  this.scene = new Scene();
  this.controller = new Controller(this.scene);
  this.resources.addModelLoader(new ServerModelLoader());
  this.resources.addModelLoader(new ServerLandChunkModelLoader(this.resources));
};

ServerApp.start = function(){
    var controller = this.controller;
    this.intervalId = setInterval(function() {  controller.tick(); }, 1000 / 30);
};

ServerApp.stop = function(){
    clearInterval(this.intervalId);
};

exports.ServerApp = ServerApp;