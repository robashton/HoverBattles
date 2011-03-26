var blah = blah || {};

blah.Hovercraft = function(id, scene) {
    this._model = blah.Model.Quad();
    this._entity = new blah.Entity(id, this._model);
    this._scene = scene;
    scene.addEntity(this._entity);
};
