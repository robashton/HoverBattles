attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform vec3 uLightPosition;

varying vec3 vNormal;
varying vec2 vTexCoords;
varying float vDistance;

void main(void){
    vTexCoords = aTextureCoord;
    vNormal = normalize(aNormal);
    vec4 transformedPosition =  uView * vec4(aVertexPosition, 1.0);

    vDistance = transformedPosition.w;
    gl_Position = uProjection * transformedPosition;
}