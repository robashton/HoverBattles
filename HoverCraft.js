var blah = blah || {};

blah.Hovercraft = function(id, scene) {
    this._model = blah.Model.Quad();
    this._entity = new blah.Entity(id, this._model);
    this._scene = scene;
    scene.addEntity(this._entity);
    
    
    var hovercraft = this;
    this._entity.attach(function(){
       hovercraft.doLogic(); 
    });
};


blah.Hovercraft.prototype.doLogic = function(){
    var terrain = this._scene.getEntity("terrain");
    
    // So we'll get the height at the current entity point
    var height =  terrain.getHeightAt(this._entity.position[0], this._entity.position[2]);
    
    // And we'll set the entity at that height
     this._entity.position[1] = height + 0.5;    
};