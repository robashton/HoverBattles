io = require('socket.io');
HovercraftFactory = require('../shared/hovercraftfactory').HovercraftFactory;

MessageDispatcher = require('../shared/messagedispatcher').MessageDispatcher;
EntityReceiver = require('../shared/network/entityreceiver').EntityReceiver;
ProxyReceiver = require('./network/proxyreceiver').ProxyReceiver;
MissileReceiver = require('../shared/network/missilereceiver').MissileReceiver;
MissileFactory = require('../shared/missilefactory').MissileFactory;
FiringController = require('../shared/aiming').FiringController;

ServerCommunication = function(app, server){
  this.server = server;
  this.app = app;
  this.socket = io.listen(server).sockets; 
  this.clients = {};
  this.liveClients = {};
  
  var server = this;  
  this.dispatcher = new MessageDispatcher();
  this.dispatcher.addReceiver(new EntityReceiver(this.app));
  this.dispatcher.addReceiver(this); // Will be refactored out
  this.dispatcher.addReceiver(new ProxyReceiver(this.app, this));
  this.dispatcher.addReceiver(new MissileReceiver(this.app, new MissileFactory()));

  this.socket.on('connection', function(socket) { server.onConnection(socket); });
};

ServerCommunication.prototype.onConnection = function(socket){
    this.clients[socket.id] = socket;
    this.hookClientEvents(socket);
};

ServerCommunication.prototype.synchronise = function(){
   for(i in this.liveClients){
		this.syncPlayer(i);
   }
};

ServerCommunication.prototype.hookClientEvents = function(socket) {
    var server = this;
    socket.on('message', function(msg) { server.dispatchMessage(socket, msg); });    
    socket.on('disconnect', function() {server.unhookClient(socket);});
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
  socket.json.send({
      command: command,
      data: data
  });
};

ServerCommunication.prototype.broadcast = function(command, data, from) {
  for(i in this.liveClients){
      if(from && this.liveClients[i].id === from) continue;
      this.sendMessageToClient(this.liveClients[i], command, data);   
  }
};

ServerCommunication.prototype.unhookClient = function(socket) {
    this.removePlayer(socket);
    delete this.clients[socket.id];  
    delete this.liveClients[socket.id];
};

ServerCommunication.prototype.removePlayer = function(socket) {
    if(socket.craft){
       this.app.scene.removeEntity(socket.craft); 
    }
    this.broadcast('removeplayer', { id: socket.id}, socket.id);
};

ServerCommunication.prototype.syncPlayer = function(id) {
	var socket = this.clients[id];
    var sync = socket.craft.getSync();
    this.broadcast('sync', {
        id: id,
        sync: sync
    });
};

ServerCommunication.prototype._ready = function( data) {
    var socket =  this.clients[data.source];
    var factory = new HovercraftFactory(this.app);
    socket.craft = factory.create(data.source);
	socket.firingController = new FiringController(socket.craft, this);
    
    this.app.scene.addEntity(socket.craft);    
    var sync = socket.craft.getSync();

    // Tell the player to create its own craft
    this.sendMessageToClient(socket, 'start', {
       id: socket.id,
       sync: sync
    });
    
    // Tell the player about the rest of the scene
    for(i in this.liveClients) {
        var client = this.liveClients[i];
        if(client == socket) continue;
        
        var sync = client.craft.getSync();        
        this.sendMessageToClient(socket, 'addplayer', {
           id: client.id,
           sync: sync
        });
    }
    
    this.liveClients[socket.id] = socket;

    // Tell everybody else that this player has joined the party
    var sync = socket.craft.getSync();
    this.broadcast('addplayer', {
       id: socket.id,
       sync: sync
    },
    socket.id);
};

exports.ServerCommunication = ServerCommunication;