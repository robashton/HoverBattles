attribute vec3 aVertexPosition;
attribute vec3 aVelocity;
attribute vec3 aColour;
attribute float aSize;
attribute float aCreationTime;
attribute float aLifetime;

uniform mat4 uProjection;
uniform mat4 uView;

uniform float maxsize;
uniform float time;
uniform vec3 vCamera;

varying vec3 vColour;
varying float life;

void main(void){

    float age = (time - aCreationTime);
    vec3 position = aVertexPosition + (aVelocity * age);
    vColour = aColour;

    vec3 vectorToPoint = (position - vCamera);
    float distanceSquared = abs(dot(vectorToPoint, vectorToPoint));
    float scale = clamp(distanceSquared, 1.0, 10000.0);      



    life = 1.0 - (age / aLifetime);
    life = clamp(life, 0.0, 1.0);

    gl_PointSize = (aSize * maxsize) / (scale / 100.0);
    gl_Position =  uProjection * uView * vec4(position, 1.0);
}