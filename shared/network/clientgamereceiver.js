ClientGameReceiver = function(app, server) {
  this.app = app;
  this.server = server;
  this.started = false;
  this.craft = null;
  this.hovercraftFactory = new HovercraftFactory(app);
};

ClientGameReceiver.prototype.attachEmitterToCraft = function(craft) {
    var emitter = new ParticleEmitter(craft.getId() + 'trail', 1000, this.app,
    {
        maxsize: 100,
        maxlifetime: 0.2,
        rate: 50,
        scatter: vec3.create([1.0, 0.001, 1.0]),
        track: function(){
            this.position = vec3.create(craft.position);
        }
    });
    craft.emitter = emitter;
    this.app.scene.addEntity(emitter);
};

ClientGameReceiver.prototype.removeCraftEmitter = function(craft) {
    this.app.scene.removeEntity(craft.emitter);
};

ClientGameReceiver.prototype._start = function(data) {
    this.started = true;
    this.craft = this.hovercraftFactory.create(data.id);   
    this.controller = new HovercraftController(data.id, this.server);
    this.craft.attach(ChaseCamera);
	this.craft.attach(Smoother);
    this.craft.setSync(data.sync);
    this.craft.player = true;
    this.app.scene.addEntity(this.craft);
    this.attachEmitterToCraft(this.craft);
};

ClientGameReceiver.prototype._addplayer = function(data) {
    var craft = this.hovercraftFactory.create(data.id);
	craft.attach(Smoother);
    craft.setSync(data.sync);
    this.app.scene.addEntity(craft);
    this.attachEmitterToCraft(craft);
};

ClientGameReceiver.prototype._removeplayer = function(data) {
    var craft = this.app.scene.getEntity(data.id);
    this.removeCraftEmitter(craft);
    this.app.scene.removeEntity(craft);
};

ClientGameReceiver.prototype._sync = function(data) {
    var entity = this.app.scene.getEntity(data.id);
    entity.setSync(data.sync);
};


exports.ClientGameReceiver = ClientGameReceiver;