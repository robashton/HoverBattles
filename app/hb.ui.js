(function() {

  var MainPage = function() {
    var self = this;
    
    self.setScores = function(scores) {

      var orderedScores = [];
      for(var playerid in scores) {
        orderedScores.push({
          playerid: playerid,
          name: scores[playerid].name,
          value: scores[playerid].value
        });
      }     

      orderedScores.sort(function(x, y) {
        return x.value > y.value ? -1 : 1;
      });    

      var scores = $('<ul></ul>');

      for(var x = 0; x < orderedScores.length; x++) {
        var value = orderedScores[x];

        var text = value.name;
        text += ' : ';
        text += value.value;

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
