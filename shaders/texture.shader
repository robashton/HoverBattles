attribute vec3 aVertexPosition;
attribute vec2 aTextureCoords;
attribute vec3 aNormals;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormal;

varying vec2 vTextureCoords;
varying vec3 vNormal;
varying vec3 vVectorFromLight;

void main(void){
    vec4 vLightPosition = vec4(0,1000,0, 0.0);
    vec4 vTransformedPosition =  uWorld * vec4(aVertexPosition, 1.0);
    gl_Position =  uProjection * uView * vTransformedPosition;
    vNormal = uNormal * aNormals;
    vVectorFromLight = vec3(vLightPosition - vTransformedPosition);
    vTextureCoords = aTextureCoords;
}
