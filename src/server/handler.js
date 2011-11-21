exports.Handler = function() {
  var self = this;

  var routes = {};

  self.route = function(method, path, callback) {
    routes[path] = {
       callback: callback,
       method: method
    };
  };

  self.handle = function(req, res) {
    var route = findRoute(req.url);
    if(!route) return false;
    if(req.method !== route.method) return false;
    parseFormData(req, res, function() {
      route.callback(req, res);
    });
    return true;
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
