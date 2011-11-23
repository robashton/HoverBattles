attribute vec2 aVertexPosition;
attribute float aVertexHeight;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;

varying vec2 vTexCoords;

void main(void){
    vTexCoords = aTextureCoord;
    vec4 transformedPosition =   uView * uWorld * vec4(aVertexPosition.x, aVertexHeight, aVertexPosition.y, 1.0);
    gl_Position = uProjection * transformedPosition;
}
