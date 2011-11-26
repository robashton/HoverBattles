var qs = require('querystring');
var Identity = require('./identity').Identity;
var data = require('./data').Data;
var Handler = require('./handler').Handler;

exports.Services = function() {
  Handler.call(this);
  var self = this;

  self.route('POST', '/services/register', function(req, res) { 
      var username = req.body.username;
      var password = req.body.password;
      var email = req.body.email;

      var userValidation = [
        function(next) {
          if(!username || username.length < 6 || username.length > 15)
            writeValidationError(req, res, 'Username is required, 6 <= length <= 15');
          else 
            next();
        },
        function(next) {
          if(username.toLowerCase().indexOf('guest') >= 0)
            writeValidationError(req, res, 'Guest is a reserved name');
          else 
            next();
        },
        function(next) {
          if(!password)
            writeValidationError(req, res, 'Password is required, it can be whatever though');
          else next();
        },
       function(next) {
        data.userExists(username, function(exists) {
          if(exists)
            writeValidationError(req, res, "Username already exists, please choose another yo'");
          else next();
        });
       },
       function(next) {
        if(!email) { next(); return; }
        data.emailExists(email, function(exists) {
          if(exists) 
            writeValidationError(req, res, "E-mail already exists, tell me on Twitter if you've forgotten your password");
          else next();
        });
       }];

      validateInput(userValidation, function() {
        data.createUser(username, password, email, function(err, doc) {
          setCookieForUser(req, res, username);     
			    res.writeHead(200, "Content-Type: application/json");
			    res.write(JSON.stringify({
            success: true
          }));
			    res.end();
        }); 
      });
  });

  self.route('POST', '/services/login', function(req, res) {
      var username = req.body.username;
      var password = req.body.password;

      data.validateCredentials(username, password, function(valid) {
        if(!valid) 
          writeValidationError(req, res, "That didn't work, try again");
        else {
          // Set the cookie so we can get gaming
          setCookieForUser(req, res, username);      

		      res.writeHead(200, "Content-Type: application/json");
		      res.write(JSON.stringify({
            success: true
          }));
		      res.end();
        }
      });
  });

  self.route('GET', '/services/highscorers', function(req, res) {
    data.getHighScorers(function(scorers) {
      res.writeHead(200, "Content-Type: application/json");
      res.write(JSON.stringify({
        items: scorers
      }));
      res.end();
    });
  });

  var validateInput = function(rules, callback) {
    runValidationRule(0, rules, callback);   
  };

  var runValidationRule = function(index, rules, callback) {
    rules[index](function() {
      if(++index < rules.length) runValidationRule(index, rules, callback);
      else callback();
    })   
  };

  writeValidationError = function(req, res, feedback) {
		res.writeHead(200, "Content-Type: application/json");
		res.write(JSON.stringify({
      success: false,
      feedback: feedback
    }));
		res.end();
  };

  var setCookieForUser = function(req, res, username) {
    Identity.signIn(req, res, username);
  };
};
