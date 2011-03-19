var blah = blah || {};

blah.RenderContext = function(){
	this.gl = null;
};

blah.RenderContext.prototype.init = function(selector) {
	var canvas =  document.getElementById(selector);
   this.gl = canvas.getContext("experimental-webgl");

   this.gl.viewportWidth = canvas.width;
   this.gl.viewportHeight = canvas.height;  

	this.gl.clearColor(0.0, 0.0, 0.0, 1.0);
   this.gl.enable(this.gl.DEPTH_TEST);  
};
