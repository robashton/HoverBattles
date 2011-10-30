(function() {

  var MainPage = function() {
    var self = this;

    var names = {};

    self.setNameFor = function(id, username) {
       names[id] = username;
    };
    
    self.setScores = function(scores) {

      var orderedScores = [];
      for(var playerid in scores) {
        orderedScores.push({
          playerid: names[playerid] || scores[playerid],          
          score: scores[playerid]
        });
      }     

      orderedScores.sort(function(x, y) {
        return x.score > y.score ? -1 : 1;
      });    

      var scores = $('<ul></ul>');

      for(var x = 0; x < orderedScores.length; x++) {
        var value = orderedScores[x];

        var text = value.playerid;
        text += ' : ';
        text += value.score;

        var item = $('<li/>').text(text);
        scores.append(item);
      }

      $('#scores').html(scores);      
    };

  };

  $(document).ready(function() {
    GlobalViewModel = new MainPage();
  });
})();
