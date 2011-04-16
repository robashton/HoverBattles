var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var ChaseCamera = require('./chasecamera').ChaseCamera;

ClientCommunication = function(app){
    this.app = app;
    this.started = false;
    this.socket = new io.Socket();
    this.hookSocketEvents();    
    this.socket.connect(); 
    this._hovercraftFactory = new HovercraftFactory(app);
};

ClientCommunication.prototype.hookSocketEvents = function() {
    var game = this;
    this.socket.on('connect', function(){        game.onConnected();     });
    this.socket.on('message', function(msg){     game.dispatchMessage(msg);   });
    this.socket.on('disconnect', function(){     game.onDisconnected(); });    
};

ClientCommunication.prototype.onConnected = function() {
  this.sendMessage('ready');  
};

ClientCommunication.prototype.onDisconnected = function() {
  throw "Disconnected";
};

ClientCommunication.prototype.dispatchMessage = function(msg) {
    var handler = this['_' + msg.command];
    handler.call(this, msg.data);  
};

ClientCommunication.prototype.sendMessage = function(command, data){
  this.socket.send({
      command: command,
      data: data      
  });
};

ClientCommunication.prototype._start = function(data) {
    this.started = true;
    this.craft = this._hovercraftFactory.create(data.id);
    this.craft.attach(HovercraftController);
    this.craft.attach(ChaseCamera);
    this.craft.position = data.position;
    this.craft._velocity = data.velocity;
    this.app.scene.addEntity(this.craft);    
};

ClientCommunication.prototype._addplayer = function(data) {
    var craft = this._hovercraftFactory.create(data.id);
    craft.position = data.position;
    craft._velocity = data.velocity;
    this.app.scene.addEntity(craft);
};

ClientCommunication.prototype._removeplayer = function(data) {
    var craft = this.app.scene.getEntity(data.id);
    this.app.scene.removeEntity(craft);
};

exports.ClientCommunication = ClientCommunication;