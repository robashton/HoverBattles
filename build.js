var stitch  = require('stitch');
var fs = require('fs');
var ShaderGeneration = require('./src/server/shadergeneration').ShaderGeneration;

var pkg = stitch.createPackage({
  paths: ['./src']
});

// Copy our code into a package and dump it in the output
pkg.compile(function (err, source){
  fs.writeFile('./site/app/src/game.js', source, function (err) {
    if (err) throw err;
  })
});

// Generate landscape geometry from inputs

// TODO: The below

// Deploy any model assets

// Deploy any texture assets

// Deploy the shaders
var shaderGenerator = new ShaderGeneration('./data/shaders');
shaderGenerator.create(function(data) {
  fs.writeFile('./site/app/src/shaders.js', data, function (err) {
    if (err) throw err;
  });
});

// Deploy the landscape definitions
