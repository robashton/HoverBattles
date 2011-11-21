var RenderTarget = require('./rendertarget').RenderTarget;

exports.RenderPipeline = function(app) {
  var self = this;
  var app = app;
  var vertexBuffer = null;
  var textureBuffer = null;

  var initialSceneRenderTarget = new RenderTarget(128, 128);
  var blurxRenderTarget = new RenderTarget(128, 128);
  var bluryRenderTarget = new RenderTarget(128, 128);

  var fullSizeScreenRenderTarget = new RenderTarget(700, 500, true);
  var outputRenderTarget = new RenderTarget(700, 500, true);

  self.init = function(context) {
    var gl = context.gl;

    vertexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadVertices), gl.STATIC_DRAW);

    quadTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(quadTextureCoords), gl.STATIC_DRAW);

    initialSceneRenderTarget.init(context);
    blurxRenderTarget.init(context);
    bluryRenderTarget.init(context);
    fullSizeScreenRenderTarget.init(context);
    outputRenderTarget.init(context);    
  };


  self.render = function(context) {
    renderSceneToInitialTarget(context);
    passThroughXFilter(context);
    passThroughYFilter(context);
    renderToFullsizeScreen(context);
    renderToScreen(context);
  };

  var renderToFullsizeScreen = function(context) {
    fullSizeScreenRenderTarget.upload(context);
    clearCurrentRenderTarget(context);
    app.scene.render(context);
    fullSizeScreenRenderTarget.clear(context);
  };

  var renderSceneToInitialTarget = function(context) {
    initialSceneRenderTarget.upload(context);
    clearCurrentRenderTarget(context);
    app.scene.render(context);
    initialSceneRenderTarget.clear(context);
  };

  var passThroughXFilter = function(context) {
    blurxRenderTarget.upload(context);
    renderTextureToQuad(context, 'blurx', initialSceneRenderTarget.getTexture());
    blurxRenderTarget.clear(context);
  };

  var passThroughYFilter = function(context) {
    bluryRenderTarget.upload(context);
    renderTextureToQuad(context, 'blury', blurxRenderTarget.getTexture());
    bluryRenderTarget.clear(context);
  };

  var renderToScreen = function(context) {
    var gl = context.gl;
    context.resetDimensions();   

    clearCurrentRenderTarget(context);

    var program = app.context.setActiveProgram('glow'); 

    uploadMatrices(program, context);
    uploadBuffers(program, context);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, fullSizeScreenRenderTarget.getTexture());
    gl.uniform1i(gl.getUniformLocation(program, 'uScene'), 0);  

    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, bluryRenderTarget.getTexture());
    gl.uniform1i(gl.getUniformLocation(program, 'uBlurred'), 1);  

    drawQuad(context);  
  };

  var renderTextureToQuad = function(context, shader, texture) {
    var gl = context.gl;
    clearCurrentRenderTarget(context);

    var program = app.context.setActiveProgram(shader); 

    uploadMatrices(program, context);
    uploadBuffers(program, context);
    
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.uniform1i(gl.getUniformLocation(program, 'uSampler'), 0);  

    drawQuad(context); 
  };
  
  var clearCurrentRenderTarget = function(context) {
    var gl = context.gl;
    gl.viewport(0, 0, context.currentWidth(), context.currentHeight());
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
  };

  var uploadMatrices = function(program, context) {
    var gl = context.gl;

    // Set the orthographic projection setup
    var projectionMatrix = mat4.ortho(0, context.currentWidth(), context.currentHeight(), 0, -1, 1);
    var viewMatrix = mat4.lookAt([0,0,0], [0,0,-1], [0,1,0]);
    var worldMatrix = mat4.create();
    
    mat4.identity(worldMatrix);
    mat4.scale(worldMatrix, [context.currentWidth(), context.currentHeight(), 1.0]);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uProjection"), false, projectionMatrix);
	  gl.uniformMatrix4fv(gl.getUniformLocation(program, "uView"), false, viewMatrix);
    gl.uniformMatrix4fv(gl.getUniformLocation(program, "uWorld"), false, worldMatrix);
  };

  var uploadBuffers = function(program, context) {
    var gl = context.gl;

    gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
	  gl.vertexAttribPointer(gl.getAttribLocation(program, 'aVertexPosition'), 3, gl.FLOAT, false, 0, 0);
	  gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aVertexPosition'));
    gl.bindBuffer(gl.ARRAY_BUFFER, quadTextureBuffer);
  	gl.vertexAttribPointer(gl.getAttribLocation(program, 'aTextureCoords'), 2, gl.FLOAT, false, 0, 0);
  	gl.enableVertexAttribArray(gl.getAttribLocation(program, 'aTextureCoords'));
  };

  var drawQuad = function(context) {
    var gl = context.gl;
    gl.depthMask(false);  
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.depthMask(true);  
  };
  



  var quadVertices =  [
       0.0,  0.0,  0.0,
       1.0,  0.0,  0.0,
       0.0,  1.0,  0.0,
       1.0,  1.0,  0.0
  ];

  var quadTextureCoords =  [
         0.0,  1.0, 
         1.0,  1.0,
         0.0,  0.0,
         1.0,  0.0,
    ];



};
