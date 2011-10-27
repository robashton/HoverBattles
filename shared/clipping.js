var Clipping = function() {
  var self = this;

  self.setBounds = function(min, max){
    self._min = min;
    self._max = max;
  };
  
  self.doLogic = function(){
    for(var i = 0 ; i < 3 ; i++){
        if(self.position[i] < self._min[i]) {
            self.position[i] = self._min[i];
            self._velocity[i] = 0;
        }
        else if(self.position[i] > self._max[i]) {
            self.position[i] = self._max[i];
            self._velocity[i] = 0;
        }
    }
  };
    
};

exports.Clipping = Clipping;
