attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormal;

uniform vec3 vLight;

varying vec3 vNormal;
varying vec3 vVectorFromLight;
varying vec2 vTextureCoord;

void main(void){
    vec4 vTransformedPosition =  uView * uWorld * vec4(aVertexPosition, 1.0);
    gl_Position =  uProjection *  vTransformedPosition;
    vNormal = uNormal * aNormal;
    vTextureCoord = aTextureCoord;
    vVectorFromLight = vec3(vec4(vLight, 1.0) - vTransformedPosition);
}
