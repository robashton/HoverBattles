var config = require('./config');

var url = config(DB_CONFIG_FILE)
var CouchClient = require('couch-client');
var db = new CouchClient(url);

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
   self.getUserByName(username, function(user) {
      if(user)
        callback(true);
      else
        callback(false);
   });
  };

  self.getUserByName = function(username, callback) {
   db.view('/hoverbattles/_design/users/_view/by_username', { key: username }, function(err, doc) {
      if(!doc.rows || doc.rows.length === 0) 
        callback(null);
      else 
        callback(doc.rows[0].value);
    });
  };
  
  self.getHighScorers = function(callback) {
   db.view('/hoverbattles/_design/users/_view/by_totalscore', function(err, doc) {
      var returnValues = [];
      for(var i = 0; i < doc.rows.length; i++)
        returnValues.push(doc.rows[i].value);
      callback(returnValues);
    });
  };

  self.emailExists = function(email, callback) {
   db.view('/hoverbattles/_design/users/_view/by_email', { key: email }, function(err, doc) {
      if(!doc.rows || doc.rows.length === 0)   
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

  self.updatePlayerStats = function(username) {
/*    var updater = new PlayerStatsUpdater(self, username);
    getPlayerScore(username, updater.notifyPlayerScore);
    getPlayerKills(username, updater.notifyPlayerKills);
    getPlayerDeaths(username, updater.notifyPlayerDeaths); */
  };

  var getPlayerScore = function(username, callback) {
   db.view('/hoverbattles/_design/stats/_view/score', { key: username, group: true  }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(0);
      else {
        var score = doc.rows[0].value;
        callback(score);     
      }  
    });
  };

  var getPlayerKills = function(username, callback) {
   db.view('/hoverbattles/_design/stats/_view/kills', { key: username, group: true  }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(0);
      else {
        var kills = doc.rows[0].value;
        callback(kills);
      }     
    });
  };

  var getPlayerDeaths = function(username, callback) {
   db.view('/hoverbattles/_design/stats/_view/deaths', { key: username, group: true  }, function(err, doc) {
      if(!doc.rows || doc.rows.length == 0) 
        callback(0);
      else {
        var deaths = doc.rows[0].value;
        callback(deaths);
      }
    });
  };
  
  self.storeEvent = function(eventName, data) { /*
    db.save({
      type:"event",
      eventType: eventName,
      data: data           
    },
    function(err, data) {
      if(err) console.trace(err);
    }); */
  };
  
  self.save = function(doc) {
   // db.save(doc);
  };
};


var PlayerStatsUpdater = function(api, username) {
  var self = this;

  var score = null,
      kills = null,
      deaths = null;

  self.notifyPlayerScore = function(data) {
    score = data;
    tryUpdateDocument();
  };    

  self.notifyPlayerKills = function(data) {
    kills = data;
     tryUpdateDocument();
  };

  self.notifyPlayerDeaths = function(data) {
    deaths = data;
    tryUpdateDocument();
  };

  var tryUpdateDocument = function() {
    if(score !== null && kills !== null && deaths !== null)
      actuallyUpdateDocument();
  };  

  var actuallyUpdateDocument = function() {
    api.getUserByName(username, updateUserDocument);
  };

  var updateUserDocument = function(document) {
    if(!document) return;

    document.totalscore = score;
    document.totalkills = kills;
    document.totaldeaths = deaths;
    db.save(document);
  };
};

exports.Data = new Data();
