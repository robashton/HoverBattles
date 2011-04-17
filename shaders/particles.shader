attribute vec3 aVertexPosition;
attribute vec3 aVelocity;
attribute vec4 aColour;
attribute float aSize;

uniform mat4 uProjection;
uniform mat4 uView;

uniform float maxsize;
uniform float time;
uniform vec3 vCamera;

varying vec4 vColour;

void main(void){
    vec3 position = aVertexPosition + (aVelocity * time);
    vColour = aColour;

    vec3 vectorToPoint = (position - vCamera);
    float distanceSquared = abs(dot(vectorToPoint, vectorToPoint));
    float scale = clamp(distanceSquared, 1.0, 10000.0);      

    gl_PointSize = (aSize * maxsize) / (scale / 100.0);
    gl_Position =  uProjection * uView * vec4(position, 1.0);
}
