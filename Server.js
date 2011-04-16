http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');
paperboy = require('paperboy');
var stitch  = require('stitch');


landscape = require('./server/LandscapeGeneration');
shaders = require('./server/ShaderGeneration');
ServerApp = require('./server/application').ServerApp;
ServerCommunication = require('./server/communication').ServerCommunication;

/*
*/
var pkg = stitch.createPackage({
  paths: ['./shared']
});


pkg.compile(function (err, source){
  fs.writeFile('game.js', source, function (err) {
    if (err) throw err;
    console.log('Compiled game.js');
  })
});

ROOT = path.dirname(__filename);
SHADERDIR = path.join(ROOT, "shaders");

server = http.createServer(function(req, res){ 

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

var app = new ServerApp();
var game = new ServerCommunication(app, server);
