EntityReceiver = function(app) {
    this.app = app;
};

EntityReceiver.prototype._impulseUp = function(data) {
    var entity = this.getEntity(data.id);
    entity.impulseUp();
};

EntityReceiver.prototype._impulseForward = function(data) {
    var entity = this.getEntity(data.id);
    entity.impulseForward();
};

EntityReceiver.prototype._impulseBackward = function(data) {
    var entity = this.getEntity(data.id);
    entity.impulseBackward();
};

EntityReceiver.prototype._impulseLeft = function(data) {
    var entity = this.getEntity(data.id);
    entity.impulseLeft();
};

EntityReceiver.prototype._impulseRight = function(data) {
    var entity = this.getEntity(data.id);
    entity.impulseRight();
};

EntityReceiver.prototype.getEntity = function(id) {
  return this.app.scene.getEntity(id);
};

exports.EntityReceiver = EntityReceiver;