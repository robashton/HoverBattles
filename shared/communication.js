var HovercraftFactory = require('./hovercraftfactory').HovercraftFactory;
var HovercraftController = require('./hovercraftcontroller').HovercraftController;
var ChaseCamera = require('./chasecamera').ChaseCamera;

var MessageDispatcher = require('./messagedispatcher').MessageDispatcher;
var ClientGameReceiver = require('./network/clientgamereceiver').ClientGameReceiver;
var EntityReceiver = require('./network/entityreceiver').EntityReceiver;
var MissileFactory = require('./missilefactory').MissileFactory;
var MissileReceiver = require('./network/missilereceiver').MissileReceiver;
var ScoreReceiver = require('./network/scorereceiver').ScoreReceiver;

ClientCommunication = function(app){
    this.app = app;
    this.started = false;
    this.socket = io.connect();
    this.hookSocketEvents();
    
    // Set up our messengers!!
    this.dispatcher = new MessageDispatcher();
    this.dispatcher.addReceiver(new ClientGameReceiver(this.app, this)); 
    this.dispatcher.addReceiver(new EntityReceiver(this.app));
	  this.dispatcher.addReceiver(new MissileReceiver(this.app, this, new MissileFactory()));
    this.dispatcher.addReceiver(new ScoreReceiver(this.app, this));
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
  throw "Disconnected";
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
