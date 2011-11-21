attribute vec3 aVertexPosition;
attribute vec4 aVertexColour;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;

varying vec4 vColour;

void main(void){
	gl_Position =  uProjection * uView * uWorld * vec4(aVertexPosition, 1.0);
	vColour = aVertexColour;
}
