var blah = blah || {};

blah.Texture = function(name){
    this._data = null;
    this._name = name;
};

blah.Texture.prototype.setData = function(data) {
    this._data = data;
};

blah.Texture.prototype.get = function(){
    return this._data;
};