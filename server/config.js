(function() {
  var fs;
  fs = require('fs');
  module.exports = function(file_name) {
    return JSON.parse(fs.readFileSync(file_name, 'utf8'))[ENV];
  };
}).call(this);
