exports.NamedItem = function() {
  var self = this;
  var displayName = null;
  var displayNameChanged = false;

  self.displayName = function(name) {
    if(name) {
      displayName = name;
      displayNameChanged = true;
    }
    return displayName;
  }; 

  self.updateSync = function(sync) {
   // if(displayNameChanged) {
   //   displayNameChanged = false;
      sync.displayName = displayName;
  //  }
  };

  self.setSync = function(sync) {
	  displayName = sync.displayName || displayName;
	};

};


