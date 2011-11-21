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
};
