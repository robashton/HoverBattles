attribute vec3 aVertexPosition;
uniform mat4 uProjection;
uniform mat4 uView;

void main(void){
	gl_Position =  uProjection * uView * vec4(aVertexPosition, 1.0);
}
