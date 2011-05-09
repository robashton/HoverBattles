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
  var handler = this['_' + msg.command];
  handler.call(this, socket, msg.data);  
};

ServerCommunication.prototype.sendMessage = function(socket, command, data){
  console.log({
     command: command,
     data: data
  });
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

ServerCommunication.prototype._request_fire = function(socket, data) {
    var craft = socket.craft;
    if(!socket.missile && craft.canFire()){
       
       // Create a missile  
       // Tell the craft a missile has been created       
       // Tell the client that it can go ahead and do exactly the same       
       // Tell all attached clients that this event has taken place (AGH)
       var missileFactory = new MissileFactory(this.app);
       var missile = missileFactory.create(craft);
       socket.missile = missile;
       this.sendMessage(socket, 'confirm_fire', {});
      // this.broadcast('fire', { 
    }
    else
    {
        // Tell the client no, it can't have a missile
        this.sendMessage(socket, 'reject_fire', {});
    }
};

ServerCommunication.prototype._message = function(socket, data){
    var method = socket.craft[data.method];
    method.call(socket.craft);
    var sync = socket.craft.getSync();
    this.broadcast('sync', { id: socket.sessionId, sync: sync });
};


exports.ServerCommunication = ServerCommunication;