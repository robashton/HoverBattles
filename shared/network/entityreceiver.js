EntityReceiver = function(socket, entity) {
    this.socket = socket;
    this.entity = entity;
};

EntityReceiver.prototype._impulseUp = function() {
    this.entity.impulseUp();
};

EntityReceiver.prototype._impulseForward = function() {
    this.entity.impulseForward();
};

EntityReceiver.prototype._impulseBackward = function() {
    this.entity.impulseBackward();
};

EntityReceiver.prototype._impulseLeft = function() {
    this.entity.impulseLeft();
};

EntityReceiver.prototype._impulseRight = function() {
    this.entity.impulseRight();
};