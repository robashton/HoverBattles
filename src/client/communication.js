var EntityReceiver = require('../core/entityreceiver').EntityReceiver;
var MessageDispatcher = require('../core/messagedispatcher').MessageDispatcher;
var MissileFactory = require('../entities/missilefactory').MissileFactory;
var ChaseCamera = require('../entities/chasecamera').ChaseCamera;
var HovercraftFactory = require('../entities/hovercraftfactory').HovercraftFactory;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var EventReceiver = require('./eventreceiver').EventReceiver;
var ClientGameReceiver = require('./clientgamereceiver').ClientGameReceiver;

ClientCommunication = function(app){
    this.app = app;
    this.started = false;
    this.socket = io.connect();
    this.hookSocketEvents();
    
    this.dispatcher = new MessageDispatcher();
    this.dispatcher.addReceiver(new ClientGameReceiver(this.app, this)); 
    this.dispatcher.addReceiver(new EntityReceiver(this.app));
    this.dispatcher.addReceiver(new EventReceiver(this.app.scene));
};

ClientCommunication.prototype.hookSocketEvents = function() {
    var game = this;
    this.socket.on('connect', function(){        game.onConnected();     });
    this.socket.on('message', function(msg){     game.dispatchMessage(msg);   });
    this.socket.on('disconnect', function(){     game.onDisconnected(); });    
};

ClientCommunication.prototype.onConnected = function() {

};

ClientCommunication.prototype.onDisconnected = function() {
  alert('Sorry dude, you\'ve been disconnected, try to refresh to rejoin the action');
};

ClientCommunication.prototype.dispatchMessage = function(msg) {
    this.dispatcher.dispatch(msg);
};

ClientCommunication.prototype.sendMessage = function(command, data){
  var msg = { command: command, data: data };
  
  // To ourselves
  this.dispatchMessage(msg);
  
  // To the server
  this.socket.json.send(msg);
};

exports.ClientCommunication = ClientCommunication;
