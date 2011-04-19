attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormal;

uniform vec3 vLight;
uniform vec3 uViewDirection;

varying vec3 vNormal;
varying vec3 vVectorToLight;
varying vec3 vViewDirection;
varying vec2 vTextureCoord;
varying vec3 vTangent;
varying vec3 vBiTangent;
varying vec3 vHalfVector;

void main(void){
    vec4 vTransformedPosition =  uView * uWorld * vec4(aVertexPosition, 1.0);

    // Calculate vector from light
    vec3 vectorToLight = vec3(vec4(vLight.x, vLight.y, vLight.z, 1.0) - vTransformedPosition);
    vectorToLight = normalize(vectorToLight);

    // Transform tangent/bitangent/normal
    vTangent = normalize(uNormal * vec3(1,0,0));
    vNormal  = normalize(uNormal * aNormal);
    vBiTangent = cross(vTangent, vNormal);

    // Transform the light vector into texture space
    vVectorToLight = vec3(
                dot(vectorToLight, vTangent),
                dot(vectorToLight, vBiTangent),
                dot(vectorToLight, vNormal));
    vVectorToLight = normalize(vVectorToLight);

    // Transform the eye into texture space
    vViewDirection = vec3(
                dot(uViewDirection, vTangent),
                dot(uViewDirection, vBiTangent),
                dot(uViewDirection, vNormal));
    vViewDirection = normalize(vViewDirection);
    
    // Transform the half vector into texture space
    vHalfVector = normalize((vViewDirection + vVectorToLight) / 2.0);
    vHalfVector = vec3(
                dot(vHalfVector, vTangent),
                dot(vHalfVector, vBiTangent),
                dot(vHalfVector, vNormal));

    // And finally set the texture coords + position
    gl_Position =  uProjection *  vTransformedPosition;
    vTextureCoord = aTextureCoord;
}
