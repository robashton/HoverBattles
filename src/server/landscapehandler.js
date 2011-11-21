path = require('path');
fs = require('fs');
querystring = require('querystring');
vec3 = require('../thirdparty/glmatrix').vec3;
gzip = require('gzip');
Handler = require('./handler').Handler;
LandscapeGeneration = require('./landscapegeneration').LandscapeGeneration;

exports.LandscapeHandler = function() {
  Handler.call(this);

  var self = this;
  var cache = {};

  self.route('GET', '/Landscape', function(req, res) {
    searchForLandscape(req, res, function(data) {
      res.setHeader("Content-Type", "text/javascript");
      res.setHeader("Content-Encoding", "gzip");
	    res.writeHead(200);
      res.write(data);
	    res.end();
    });
  });

  var searchForLandscape = function(req, res, success) {
      tryReadFromCache(req, res, success, tryReadFromFile);
  };

  var tryReadFromCache = function(req, res, success, next) {
    if(cache[req.url]) { 
      success(cache[req.url]);
    } else {
      next(req, res, success, generateFromQueryString);
    }
  };

  var tryReadFromFile = function(req, res, success, next) {
    fs.readFile('./cache/' + req.url, function(err, data) {
      if(err)
	      next(req, res, success);    
      else {
        cache[req.url] = data;
        success(data);
      }
    });
  };

  var generateFromQueryString = function(req, res, success) {
    var query =  querystring.parse(req.url);
    var maxHeight = parseInt(query.maxheight);
		var width = parseInt(query.width);
		var height = parseInt(query.height);
		var startX = parseInt(query.startx);
		var startY = parseInt(query.starty);
		var scale = parseInt(query.scale);

    var generator = new LandscapeGeneration(width, height, startX, startY, scale, maxHeight);
    var rawData = generator.create();

    convertRawDataIntoString(req, rawData, function(data) {
       writeToFile(req.url, data);
       success(data);
    });
  };  
  
  var convertRawDataIntoString = function(req, rawData, callback) {
		var model = JSON.stringify(rawData);
		gzip(model, function(err, zippeddata) {
			callback(zippeddata);    
		});
  };

  var writeToFile = function(filename, data) {
    fs.writeFile('./cache/' + filename, data);
  };
};
