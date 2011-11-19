io = require('socket.io');

EventReceiver = require('./network/eventreceiver').EventReceiver;
MessageDispatcher = require('../shared/messagedispatcher').MessageDispatcher;
EntityReceiver = require('../shared/network/entityreceiver').EntityReceiver;
ProxyReceiver = require('./network/proxyreceiver').ProxyReceiver;
ServerGameReceiver = require('./network/servergamereceiver').ServerGameReceiver;

ServerCommunication = function(app, server){
  var self = this;
  this.server = server;
  this.app = app;
  var listener = io.listen(server);

  listener.configure(function(){
      listener.set('log level', 1);
    });
  
  this.socket = listener.sockets;
  this.clients = {};

  this.dispatcher = new MessageDispatcher();

  this.dispatcher.addReceiver(new EventReceiver(this.app, this));
  this.dispatcher.addReceiver(new EntityReceiver(this.app));
  this.dispatcher.addReceiver(new ProxyReceiver(this.app, this));

  this.game = new ServerGameReceiver(this.app, this);
  this.dispatcher.addReceiver(this.game); 
  this.socket.on('connection', function(socket) { self.onConnection(socket); });
};

ServerCommunication.prototype.onConnection = function(socket) {
    this.clients[socket.id] = socket;
    this.hookClient(socket);
};

ServerCommunication.prototype.synchronise = function(){
   for(i in this.clients){
		this.syncPlayer(i);
   }
};

ServerCommunication.prototype.rejectClient = function(id) {
  var socket = this.clients[id];
  delete this.clients[id];  
  this.sendMessageToClient(socket, 'noauth');
};

ServerCommunication.prototype.hookClient = function(socket) {
    var server = this;
	  this.initializeClient(socket);
    socket.on('message', function(msg) { server.dispatchMessage(socket, msg); });    
    socket.on('disconnect', function() {server.unhookClient(socket);});
};

ServerCommunication.prototype.initializeClient = function(socket) {
	this.sendMessageToClient(socket, 'init', { id: socket.id });
};

ServerCommunication.prototype.unhookClient = function(socket) {
    this.game.removePlayer(socket.id);    
    delete this.clients[socket.id];  
};

ServerCommunication.prototype.dispatchMessage = function(socket, msg) {
    msg.data = msg.data || {};
    msg.data.source = socket.id;
    this.dispatcher.dispatch(msg);
};

ServerCommunication.prototype.sendMessage = function(command, data) {
	this.broadcast(command, data);
	this.dispatcher.dispatch({
		command: command,
		data: data
	});
};

ServerCommunication.prototype.sendMessageToClient = function(socket, command, data){
  try {
    socket.json.send({
        command: command,
        data: data
    });
  } catch(ex) {
    console.log('Failed to write to a socket for id: ' + socket.id + ', closing socket');
    this.unhookClient(socket);
  };
};

ServerCommunication.prototype.broadcast = function(command, data, from) {
  for(i in this.clients){
      if(from && this.clients[i].id === from) continue;
      this.sendMessageToClient(this.clients[i], command, data);   
  }
};

ServerCommunication.prototype.syncPlayerFull = function(id) {
	var socket = this.clients[id];
	var sceneData = this.game.getSceneState();
  this.sendMessageToClient(socket, 'syncscene', sceneData);
};

ServerCommunication.prototype.syncPlayer = function(id, force) {
	var socket = this.clients[id];
	var sync = this.game.getSyncForPlayer(id);
  if(!sync) return;

  this.broadcast('sync', {
       id: id,
       sync: sync,
       force : force || false
   });
};

exports.ServerCommunication = ServerCommunication;
