attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;

varying vec2 vTexCoords;

void main(void){
    vTexCoords = aTextureCoord;
    gl_Position = uProjection * uView * vec4(aVertexPosition, 1.0);
}