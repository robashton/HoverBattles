EntityReceiver = function(app) {
    this.app = app;
};

EntityReceiver.prototype._startUp = function(data) {
    var entity = this.getEntity(data.id);
    entity.startUp();
};

EntityReceiver.prototype._cancelUp = function(data) {
    var entity = this.getEntity(data.id);
    entity.cancelUp();
};

EntityReceiver.prototype._startForward = function(data) {
    var entity = this.getEntity(data.id);
    entity.startForward();
};


EntityReceiver.prototype._cancelForward = function(data) {
  var entity = this.getEntity(data.id);
  entity.cancelForward();
};

EntityReceiver.prototype._startBackward = function(data) {
    var entity = this.getEntity(data.id);
    entity.startBackward();
};

EntityReceiver.prototype._cancelBackward = function(data) {
    var entity = this.getEntity(data.id);
    entity.cancelBackward();
};

EntityReceiver.prototype._startLeft = function(data) {
    var entity = this.getEntity(data.id);
    entity.startLeft();
};

EntityReceiver.prototype._cancelLeft = function(data) {
    var entity = this.getEntity(data.id);
    entity.cancelLeft();
};

EntityReceiver.prototype._startRight = function(data) {
    var entity = this.getEntity(data.id);
    entity.startRight();
};

EntityReceiver.prototype._cancelRight = function(data) {
    var entity = this.getEntity(data.id);
    entity.cancelRight();
};

EntityReceiver.prototype.getEntity = function(id) {
  return this.app.scene.getEntity(id);
};

exports.EntityReceiver = EntityReceiver;