
var ProxyReceiver = function(app, communication) {
  this.app = app;
  this.communication = communication;
};

var proxiedMessages = [
	"_startUp",
	"_cancelUp",
	"_startForward",
	"_cancelForward",
	"_startBackward",
	"_startLeft",
	"_cancelLeft",
	"_startRight",
	"_cancelRight"	
];

for(var msg in proxiedMessages) {
	ProxyReceiver.prototype[msg] = function(){
		
	}
}

exports.ProxyReceiver = ProxyReceiver;