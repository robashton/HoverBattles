http = require('http'),  
path = require('path'),
io = require('socket.io'), 
fs = require('fs');
paperboy = require('paperboy');
var stitch  = require('stitch');

landscapeHandle = require('./server/LandscapeGeneration').handle;
shaders = require('./server/ShaderGeneration');
ServerApp = require('./server/application').ServerApp;
ServerCommunication = require('./server/communication').ServerCommunication;
LandscapeController = require('./shared/landscapecontroller').LandscapeController;

var pkg = stitch.createPackage({
  paths: ['./shared']
});

ROOT = path.dirname(__filename);
SHADERDIR = path.join(ROOT, "shaders");

buildPackages = function(callback) {
	pkg.compile(function (err, source){
	  fs.writeFile('game.js', source, function (err) {
	    if (err) throw err;
		callback();
	  })
	});	
};

buildPackages(function() { console.log("Packages built"); });

server = http.createServer(function(req, res){ 
    var query = querystring.parse(req.url);

	paperboy
	.deliver(ROOT, req, res)
	.addHeader('Cache-Control', 'no-cache')
	.otherwise(function(){
        
		if(req.url.indexOf("/Landscape&") == 0) {
			landscapeHandle(req, res);
		}
		else if(req.url.indexOf("/Shaders.js") == 0) {
			shaders.handle(req, res);
		}
		else if(req.url.indexOf('/Build') == 0) {
			buildPackages(function() {
				res.writeHead(200, "Content-Type: application/json");
				res.write('{}');
				res.end();
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
server.listen(1220);

console.log("Listening on port 1220");

var app = new ServerApp();
var controller = new Controller(app.scene);
var game = new ServerCommunication(app, server);
var landscape = new LandscapeController(app);

console.log("Initialized Engine");

app.resources.onAllAssetsLoaded(function(){
    
    console.log("Loaded engine assets");
    
    setInterval(function(){
        controller.tick();
    }, 1000 / 30);
    
    setInterval(function(){    
        game.synchronise();
    }, 500); 
});


