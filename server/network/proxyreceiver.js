
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
	"_cancelBackward",
	"_startLeft",
	"_cancelLeft",
	"_startRight",
	"_cancelRight"	
];

ProxyReceiver.setupProxyMessageHandler = function(msgName) {
	ProxyReceiver.prototype[msgName] = function(data){
		this.communication.broadcast(msgName.substr(1), data, data.source);
	}	
}

for(var x = 0; x < proxiedMessages.length; x++) {
	var msg = proxiedMessages[x];
	ProxyReceiver.setupProxyMessageHandler(msg);
}



exports.ProxyReceiver = ProxyReceiver;
