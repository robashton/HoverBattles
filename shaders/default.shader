attribute vec3 aVertexPosition;
uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;

void main(void){
	gl_Position =  uProjection * uView * uWorld * vec4(aVertexPosition, 1.0);
}
