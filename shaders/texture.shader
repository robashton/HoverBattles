attribute vec3 aVertexPosition;
attribute vec2 aTextureCoords;
attribute vec3 aNormals;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormalMatrix;

varying vec2 vTextureCoords;
varying vec3 vNormal;
varying vec3 vVectorToLight;

void main(void){
    vec4 lightPosition = vec4(0.0 ,1000.0, 0.0, 0.0);
    vec4 transformedPosition =  uView * uWorld * vec4(aVertexPosition, 1.0);
    gl_Position =  uProjection * transformedPosition;

    vNormal = uNormalMatrix * aNormals;
    vVectorToLight = vec3(lightPosition - transformedPosition);
    vTextureCoords = aTextureCoords;
}
