var ResourceManager = require('../core/resources').ResourceManager;
var Scene = require('../core/scene').Scene;
var Controller = require('../core/controller').Controller;
var ServerModelLoader = require('./servermodelloader').ServerModelLoader;
var ServerLandChunkModelLoader = require('./serverlandchunkloader').ServerLandChunkModelLoader;

ServerApp = function(){
  this.resources = new ResourceManager(this);
  this.scene = new Scene(this);
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
