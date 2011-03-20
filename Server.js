http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');
paperboy = require('paperboy');

ROOT = path.dirname(__filename);
SHADERDIR = path.join(ROOT, "shaders");

server = http.createServer(function(req, res){ 

	// Serve all these lovely static files
	paperboy
	.deliver(ROOT, req, res)
	.addHeader('Cache-Control', 'no-cache')
	.otherwise(function(){

		if(req.url.indexOf("/Shaders.js") == 0) {
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
					var readFile = function(type) {
						fs.readFile(shaderFile, "utf8", function(err, data) {
							shaders[shaderName][type] = data;
							workRemaining--;

							if(workRemaining == 0){

								var shaderData = "var blah = blah || {};\n";
								shaderData += "blah.Shaders = \n";
								shaderData += JSON.stringify(shaders);
								shaderData += ";";

								res.writeHead(200, "Content-Type: application/javascript");
								res.write(shaderData);
								res.end();
							}
						});								
					}		
					readFile(type);		
					
				};
					
			});
		}
		else
		{
				res.writeHead(404, "Content-Type: text/plain");
				res.write("Not found and all that");
				res.end();
		}

	});

	

});
server.listen(8080);
