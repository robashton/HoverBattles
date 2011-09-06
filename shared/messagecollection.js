var MessageCollection = function() {
	this.inner = [];
};

MessageCollection.prototype.add = function(messageName, data) {
	this.inner.push({
		messageName: messageName,
		data: data
	});
};

MessageCollection.prototype.hasMessage = function(messageName, expectedData) {
	for(var x = 0 ; x < this.inner.length; x++){
		var msg = this.inner[x];
		if(msg.messageName != messageName) continue;
		for(var key in expectedData) {
			if(msg.data[key] !== expectedData[key])
			return false;
		}
		return true;
	}
	return false;	
};

exports.MessageCollection = MessageCollection;