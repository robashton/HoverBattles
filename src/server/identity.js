var Cookies = require('cookies');
var Keygrip = require('keygrip');
var config = require('./config');

var keys = null;

if(process.env.COOKIE_KEYS) {
  keys = JSON.parse(process.env.COOKIE_KEYS);
} else {
  keys = config(KEYS_CONFIG_FILE);
}

exports.Identity = {
  verifyUsername: function(username, sign) {
    return self.keys().verify( username || "nope", sign || "nope" )
  },
  signIn: function(req, res, username) {
    self.cookies(req, res).set('username', username, {
      httpOnly: false
    });
    self.cookies(req, res).set('sign', self.keys().sign(username), {
      httpOnly: false
    });
  },
  isSignedIn: function(req, res) {
    var username = self.cookies(req, res).get('username');
    var sign = self.cookies(req, res).get('sign');
    return self.verifyUsername(username, sign);
  },
  keys: function() {
    return new Keygrip(keys);
  },
  cookies: function(req, res) {
    return new Cookies(req, res);
  }
};
var self = exports.Identity;
