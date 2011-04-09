var blah = blah || {};

blah.Clipping = {
  setBounds: function(min, max){
    this._min = min;
    this._max = max;
  },
  
  doLogic: function(){
    for(var i = 0 ; i < 3 ; i++){
        if(this.position[i] < this._min[i]) {
            this.position[i] = this._min[i];
            this._velocity[i] = 0; //-this._velocity[i];
        }
        else if(this.position[i] > this._max[i]) {
            this.position[i] = this._max[i];
            this._velocity[i] = 0; //-this._velocity[i];    
        }
    }
  }
    
};