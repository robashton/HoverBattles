(function() {

  var MainPage = function() {
    var self = this;
    
    self.setScores = function(scores) {

      var orderedScores = [];
      for(var playerid in scores) {
        orderedScores.push({
          playerid: playerid,
          score: scores[playerid]
        });
      }     

      orderedScores.sort(function(x, y) {
        return x.score > y.score ? -1 : 1;
      });    

      var html = '<ul>';

      for(var x = 0; x < orderedScores.length; x++) {
        var item = orderedScores[x];
        html += '<li>';

        html += item.playerid;
        html += ' : ';
        html += item.score;

        html += '</li>';
      }    

      html += '</ul>';

      $('#scores').html(html);      
    };

  };

  $(document).ready(function() {
    GlobalViewModel = new MainPage();
  });
})();
