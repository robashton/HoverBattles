attribute vec3 aVertexPosition;
attribute vec2 aTextureCoords;
attribute vec3 aNormals;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;

varying vec2 vTextureCoords;
varying vec3 vNormal;

void main(void){
    gl_Position =  uProjection * uView * uWorld * vec4(aVertexPosition, 1.0);
    vNormal = aNormals;
    vTextureCoords = aTextureCoords;
}
