io = require('socket.io');
HovercraftFactory = require('../shared/hovercraftfactory').HovercraftFactory;

MessageDispatcher = require('../shared/messagedispatcher').MessageDispatcher;
EntityReceiver = require('../shared/network/entityreceiver').EntityReceiver;

ServerCommunication = function(app, server){
  this.server = server;
  this.app = app;
  this.socket = io.listen(server); 
  this.clients = {};
  this.liveClients = {};
  
  var server = this;  
  this.dispatcher = new MessageDispatcher();
  this.dispatcher.addReceiver(new EntityReceiver(this.app));
  this.dispatcher.addReceiver(this); // Will be refactored out
  
  this.socket.on('connection', function(socket) { server.onConnection(socket); });
};

ServerCommunication.prototype.onConnection = function(socket){
    this.clients[socket.sessionId] = socket;
    this.hookClientEvents(socket);
};

ServerCommunication.prototype.synchronise = function(){
    for(i in this.liveClients){
     var client = this.liveClients[i];
     var sync = client.craft.getSync();
     this.broadcast('sync', {
         id: client.sessionId,
         sync: sync
     });
    }
};

ServerCommunication.prototype.hookClientEvents = function(socket) {
    var server = this;
    socket.on('message', function(msg) { server.dispatchMessage(socket, msg); });    
    socket.on('disconnect', function() {server.unhookClient(socket);});
};

ServerCommunication.prototype.dispatchMessage = function(socket, msg) {
    msg.data = msg.data || {};
    msg.data.source = socket.sessionId;
    this.dispatcher.dispatch(msg);
    this.broadcast(msg.command, msg.data, socket);
};

ServerCommunication.prototype.sendMessage = function(socket, command, data){
  socket.send({
      command: command,
      data: data      
  });
};

ServerCommunication.prototype.broadcast = function(command, data, from) {
  for(i in this.liveClients){
      if(from && this.liveClients[i] === from) continue;
      this.sendMessage(this.liveClients[i], command, data);   
  }
};

ServerCommunication.prototype.unhookClient = function(socket) {
    this.removePlayer(socket);
    delete this.clients[socket.sessionId];  
    delete this.liveClients[socket.sessionId];
};

ServerCommunication.prototype.removePlayer = function(socket) {
    if(socket.craft){
       this.app.scene.removeEntity(socket.craft); 
    }
    this.broadcast('removeplayer', { id: socket.sessionId}, socket);
};

ServerCommunication.prototype._ready = function( data) {
    var socket =  this.clients[data.source];
    var factory = new HovercraftFactory(this.app);
    socket.craft = factory.create(data.source);
    
    this.app.scene.addEntity(socket.craft);    
    var sync = socket.craft.getSync();

    // Tell the player to create its own craft
    this.sendMessage(socket, 'start', {
       id: socket.sessionId,
       sync: sync
    });
    
    // Tell the player about the rest of the scene
    for(i in this.liveClients) {
        var client = this.liveClients[i];
        if(client == socket) continue;
        
        var sync = client.craft.getSync();        
        this.sendMessage(socket, 'addplayer', {
           id: client.sessionId,
           sync: sync
        });
    }
    
    this.liveClients[socket.sessionId] = socket;

    // Tell everybody else that this player has joined the party
    var sync = socket.craft.getSync();
    this.broadcast('addplayer', {
       id: socket.sessionId,
       sync: sync
    },
    socket);
};

exports.ServerCommunication = ServerCommunication;