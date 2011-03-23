http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');
paperboy = require('paperboy');
landscape = require('./LandscapeGeneration');
shaders = require('./ShaderGeneration');

ROOT = path.dirname(__filename);
SHADERDIR = path.join(ROOT, "shaders");

server = http.createServer(function(req, res){ 

	// Serve all these lovely static files
	paperboy
	.deliver(ROOT, req, res)
	.addHeader('Cache-Control', 'no-cache')
	.otherwise(function(){

		if(req.url.indexOf("/Landscape") == 0) {
			landscape.handle(req, res);
		}
		else if(req.url.indexOf("/Shaders.js") == 0) {
			shaders.handle(req, res);
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
