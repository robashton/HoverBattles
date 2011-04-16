io = require('socket.io');
HovercraftFactory = require('../shared/hovercraftfactory').HovercraftFactory;

ServerCommunication = function(app, server){
  this.server = server;
  this.app = app;
  this.socket = io.listen(server); 
  this.clients = {};
  this.liveClients = {};
  
  var server = this;
  this.socket.on('connection', function(socket) { server.onConnection(socket); });
};

ServerCommunication.prototype.onConnection = function(socket){
    this.clients[socket.sessionId] = socket;
    this.hookClientEvents(socket);
};

ServerCommunication.prototype.synchronise = function(){
    for(i in this.liveClients){
     var client = this.liveClients[i];
     this.broadcast('sync', {
         id: client.sessionId,
         position: client.craft.position,
         velocity: client.craft._velocity
     });
    }
};

ServerCommunication.prototype.hookClientEvents = function(socket) {
    var server = this;
    socket.on('message', function(msg) { server.dispatchMessage(socket, msg); });    
    socket.on('disconnect', function() {server.unhookClient(socket);});
};

ServerCommunication.prototype.dispatchMessage = function(socket, msg) {
  var handler = this['_' + msg.command];
  handler.call(this, socket, msg.data);  
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
    
    // Inform all connected clients that this has happened
    this.broadcast('removeplayer', { id: socket.sessionId}, socket);
};

ServerCommunication.prototype._ready = function(socket, data) {
    var factory = new HovercraftFactory(this.app);
    socket.craft = factory.create(socket.sessionId);
    
    console.log(socket.craft.position);
    this.app.scene.addEntity(socket.craft);

    // Tell the player to create its own craft
    this.sendMessage(socket, 'start', {
       id: socket.sessionId,
       position: socket.craft.position,
       velocity: socket.craft._velocity
    });
    
    // Tell the player about the rest of the scene
    for(i in this.liveClients) {
        var client = this.liveClients[i];
        if(client == socket) continue;
        
        this.sendMessage(socket, 'addplayer', {
           id: client.sessionId,
           position: client.craft.position,
           velocity: client.craft._velocity
        });
    }
    
    this.liveClients[client.sessionId] = socket;

    // Tell everybody else that this player has joined the party
    this.broadcast('addplayer', {
       id: socket.sessionId,
       position: socket.craft.position,
       velocity: socket.craft._velocity
    },
    socket);
};

ServerCommunication.prototype._message = function(socket, data){
    var method = socket.craft[data.method];
    method.call(socket.craft);

    // And force an update
    this.broadcast('sync', {
         id: socket.sessionId,
         position: socket.craft.position,
         velocity: socket.craft._velocity
    });
};


exports.ServerCommunication = ServerCommunication;