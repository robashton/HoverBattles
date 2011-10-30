var Cookies = require('cookies');

exports.Identity = {
  verifyUsername: function(username, sign) {
    return username != "";
  },
  signIn: function(req, res, username) {
    self.cookies(req, res).set('username', username, {
      httpOnly: false
    });
  },
  isSignedIn: function(req, res) {
    var username = self.cookies(req, res).get('username');
    var sign = self.cookies(req, res).get('sign');

    return self.verifyUsername(username, sign);
  },
  cookies: function(req, res) {
    return new Cookies(req, res);
  }
};
var self = exports.Identity;
