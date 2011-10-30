var qs = require('querystring');
var Identity = require('./identity').Identity;


exports.Services = function() {
  var self = this;
  var routes = {};

  var route = function(method, path, callback) {
    routes[path] = {
       callback: callback,
       method: method
    };
  };

  route('POST', '/services/register', function(req, res) { 
      var username = req.body.username;
      var password = req.body.password;
      var email = req.body.email;

      // TODO: Validate input

      // TODO: Create entry in couchdb
  
      // Then set the cookie so we can get gaming already
      setCookieForUser(req, res, username);      

			res.writeHead(200, "Content-Type: application/json");
			res.write(JSON.stringify({
        success: true
      }));
			res.end();
  });

  route('POST', '/services/login', function(req, res) {
      var username = req.body.username;
      var password = req.body.password;

      // TODO: Validate credentials

      // Set the cookie so we can get gaming
      setCookieForUser(req, res, username);      

			res.writeHead(200, "Content-Type: application/json");
			res.write(JSON.stringify({
        success: true
      }));
			res.end();
  });

  self.handle = function(req, res) {
    var route = findRoute(req.url);
    if(!route) return false;
    if(req.method !== route.method) return false;
    parseFormData(req, res, function() {
      route.callback(req, res);
    });
    return true;
  };

  var setCookieForUser = function(req, res, username) {
    Identity.signIn(req, res, username);
  };

  var parseFormData = function(req, res, callback) {
    if (req.method == 'POST') {
        var body = '';
        req.on('data', function (data) {
            body += data;
        });
        req.on('end', function () {
            req.body = qs.parse(body)             
            callback();
        });
    } 
    else callback();
  };

  var findRoute = function(url) {
    for(var i in routes) {
      if(url.indexOf(i) === 0) return routes[i];
    }
    return null;
  };
};
