http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');
paperboy = require('paperboy');
landscape = require('./LandscapeGeneration');
shaders = require('./ShaderGeneration');
var stitch  = require('stitch');

/*
*/
var pkg = stitch.createPackage({
  paths: ['./game']
});


pkg.compile(function (err, source){
  fs.writeFile('package.js', source, function (err) {
    if (err) throw err;
    console.log('Compiled package.js');
  })
});

ROOT = path.dirname(__filename);
SHADERDIR = path.join(ROOT, "shaders");

server = http.createServer(function(req, res){ 

	// Serve all these lovely static files
	paperboy
	.deliver(ROOT, req, res)
	.addHeader('Cache-Control', 'no-cache')
	.otherwise(function(){

		console.log(req.url);

		if(req.url.indexOf("/Landscape&") == 0) {
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
server.listen(1220);
