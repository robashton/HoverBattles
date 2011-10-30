var config = require('./config');

var url = config(DB_CONFIG_FILE)
var CouchClient = require('couch-client');
var db = CouchClient(url);

var bcrypt = require('bcrypt');  
var salt = bcrypt.gen_salt_sync(4);  

var Data = function() {
  var self = this;

  self.createUser = function(username, password, email, callback) {
     bcrypt.encrypt(password, salt, function(err, hash){
      db.save({
        type:"user", 
        username: username,
        password: hash,
        email: email             
      },
      callback);
    });
  };

  self.userExists = function(username, callback) {
   db.view('/hoverbattles/_design/users/_view/by_username', { key: username }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(false);
      else 
        callback(true);
    });
  };

  self.emailExists = function(email, callback) {
   db.view('/hoverbattles/_design/users/_view/by_email', { key: email }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0)   
        callback(false);
      else
       callback(true);
    });
  };

  self.validateCredentials = function(username, password, callback) {
   username = username || "";
   password = password || "";

   db.view('/hoverbattles/_design/users/_view/by_username', { key: username }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(false);
      else {
        var user = doc.rows[0].value;
        var result = bcrypt.compare_sync(password, user.password); 
        callback(result);
      }
    });
  };
};

exports.Data = new Data();
