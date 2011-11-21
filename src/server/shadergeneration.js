path = require('path');
fs = require('fs');

exports.ShaderGeneration = function(dir) {
  var self = this;
  var shaders = {};

  self.create = function(callback) {
	  fs.readdir(dir, function(err, files){
		  var workRemaining = files.length;
		  for(var i in files){
			 readFile(files[i], function() {
          workRemaining--;
          if(workRemaining === 0)
            dumpShadersToOutput(callback);
       });			
		  };					
	  });
  };

  var dumpShadersToOutput = function(callback) {
	  var shaderData = "var Cache = Cache || {};\n";
	  shaderData += "Cache.Shaders = \n";
	  shaderData += JSON.stringify(shaders);
	  shaderData += ";";
    callback(shaderData);
  };

  var readFile = function(file, callback) {
	  var components = file.split('.');
	  var shaderName = components[0];
	  var shaderType = components[1];

    processShader(file, shaderName, shaderType, callback);
  };

  var processShader = function(file, shaderName, shaderType, callback) {
    ensureShaderExists(shaderName);		  
    shaderType = normaliseShaderType(shaderType);
	  readShaderFromFile(file, shaderName, shaderType, callback);
  };

  var ensureShaderExists = function(shaderName) {
    if(!shaders[shaderName])
	    shaders[shaderName] = {};
  };

  var normaliseShaderType = function(shaderType) {
	  if(shaderType.indexOf("fragment") === 0)
		  return "Fragment";
	  else
		 return "Shader";	
  
  };

  var readShaderFromFile = function(file, shaderName, shaderType, callback) {
	  var shaderFile = path.join(dir, file);
	  fs.readFile(shaderFile, "utf8", function(err, data) {
		  shaders[shaderName][shaderType] = data;
      callback();
	  });								
  };
};
