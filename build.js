startup = require('./startup');

DB_CONFIG_FILE = "config/db.json"
KEYS_CONFIG_FILE = "config/keys.json"
ENV = startup.get_env();

paperboy = require('paperboy');

Services = require('./src/server/services').Services;
LandscapeHandler = require('./src/server/landscapehandler').LandscapeHandler;

var stitch  = require('stitch');
var fs = require('fs');
var ShaderGeneration = require('./src/server/shadergeneration').ShaderGeneration;
var data = require('./src/server/data').Data;
var views = require('./relax').Docs;

var pkg = stitch.createPackage({
  paths: ['./src']
});

// Copy our code into a package and dump it in the output
pkg.compile(function (err, source){
  fs.writeFile('./site/app/src/game.js', source, function (err) {
    if (err) throw err;
  })
});

// Update the database
for(var i in views) {
  data.save(views[i]);
}

// Generate landscape geometry from inputs

// TODO: The below

// Deploy any model assets
deployModels()
  .from('./models/')
  .to('/models.json');


// Deploy any texture assets

// Deploy the shaders
var shaderGenerator = new ShaderGeneration('./data/shaders');
shaderGenerator.create(function(data) {
  fs.writeFile('./site/app/src/shaders.js', data, function (err) {
    if (err) throw err;
  });
});

// Deploy the landscape definitions
