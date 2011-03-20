var blah = blah || {};
blah.Shaders = blah.Shaders || {};

blah.Shaders.Default = {
	Fragment: "#ifdef GL_ES\nprecision highp float;\n#endif\nvoid main(void) {\ngl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);\n}\n",
	Shader: "attribute vec3 aVertexPosition;\nuniform mat4 uMVMatrix;\nuniform mat4 uPMatrix;\nvoid main(void){\ngl_Position = uPMatrix * uMVMatrix * vec4(aVertexPosition, 1.0);\n}\n"
};
