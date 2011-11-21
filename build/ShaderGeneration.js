path = require('path');
fs = require('fs');

exports.handle = function(req, res) {
	var shaders = {};
	fs.readdir(SHADERDIR, function(err, files){
		var workRemaining = files.length;
		for(var i in files){
			var file = files[i];
			var components = file.split('.');

			var shaderName = components[0];
			var type = components[1];

			if(shaders[shaderName] === undefined) {
				shaders[shaderName] = {};
			}				

		 	if(type.indexOf("fragment") == 0){
				type = "Fragment";
			} else  {
				type = "Shader";
			}			

			var shaderFile = path.join(SHADERDIR, file);
			var readFile = function(shaderName, type) {
				fs.readFile(shaderFile, "utf8", function(err, data) {
					shaders[shaderName][type] = data;
					workRemaining--;

					if(workRemaining == 0){

						var shaderData = "var blah = blah || {};\n";
						shaderData += "blah.Shaders = \n";
						shaderData += JSON.stringify(shaders);
						shaderData += ";";

                        res.setHeader("Content-Type", "text/javascript");
						res.writeHead(200);
						res.write(shaderData);
						res.end();
					}
				});								
			}		
			readFile(shaderName, type);		
			
		};					
	});
};
