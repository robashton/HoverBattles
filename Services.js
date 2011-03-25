var blah = blah || {};

blah.Services = {
	getLandChunk: function(width, height, scale, maxHeight, startx, starty, callback)
		{			
			$.get('/Landscape' + 
			'&height=' + (height + 1) +
			'&width=' + (width + 1) + 
			'&scale=' + scale + 
			'&maxHeight=' + maxHeight +
			'&startx=' + startx + 
			'&starty=' + starty,
				function(json) {
					callback(JSON.parse(json));
				});
		}
};

