EntityReceiver = function(app) {
    this.app = app;
};

EntityReceiver.prototype.withEntity = function(id, callback) {
  var entity = this.getEntity(id);
  if(!entity) return;
  callback(entity);
};

EntityReceiver.prototype._startUp = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startUp();
    });
};

EntityReceiver.prototype._cancelUp = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelUp();
    });
};

EntityReceiver.prototype._startForward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startForward();
    });
};

EntityReceiver.prototype._cancelForward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelForward();
    });
};

EntityReceiver.prototype._startBackward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startBackward();
    });
};

EntityReceiver.prototype._cancelBackward = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelBackward();
    });
};

EntityReceiver.prototype._startLeft = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startLeft();
    });
};

EntityReceiver.prototype._cancelLeft = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelLeft();
    });
 };

EntityReceiver.prototype._startRight = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.startRight();
    });
};

EntityReceiver.prototype._cancelRight = function(data) {
    this.withEntity(data.id, function(entity) {
      entity.cancelRight();
    });
};

EntityReceiver.prototype.getEntity = function(id) {
  return this.app.scene.getEntity(id);
};

exports.EntityReceiver = EntityReceiver;
