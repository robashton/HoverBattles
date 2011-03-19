var blah = blah || {};

blah.RenderContext = function(){
	this._gl = null;
};

blah.RenderContext.prototype.init = function(selector) {
	var canvas = $(selector).eq(0).get();
   this._gl = canvas.getContext("experimental-webgl");
   this._gl.viewportWidth = canvas.width;
   this._gl.viewportHeight = canvas.height;    
};
