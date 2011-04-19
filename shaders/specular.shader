attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormal;
uniform vec3 uLightPosition;
uniform vec3 uCameraPosition;

varying vec2 vTextureCoord;
varying vec3 vDirectionToLight;
varying vec3 vHalfNormal;

void main(void){
    vec4 transformedPosition =  uWorld * vec4(aVertexPosition, 1.0);
    vec3 directionToCamera = normalize(uCameraPosition - vec3(transformedPosition));
    vec3 directionToLight = normalize(uLightPosition - vec3(transformedPosition));
    vDirectionToLight = vec3(0,0,0);
    vHalfNormal = vec3(0,0,0);

    vec3 tangent = normalize(uNormal * vec3(1,0,0));
    vec3 normal  = normalize(uNormal * aNormal);
    vec3 bitangent = cross(tangent, normal);
 
    // Transform direction to light into texture space    
    vDirectionToLight = vec3(
                dot(directionToLight, tangent),
                dot(directionToLight, bitangent),
                dot(directionToLight, normal));
    vDirectionToLight = normalize(vDirectionToLight);

    // Transform the camera into texture space
    directionToCamera = vec3(
                dot(directionToCamera, tangent),
                dot(directionToCamera, bitangent),
                dot(directionToCamera, normal));
    directionToCamera = normalize(directionToCamera);
    
    // Transform the half vector into texture space
    vHalfNormal = normalize(vDirectionToLight + directionToCamera);
    vHalfNormal = vec3(
                dot(vHalfNormal, tangent),
                dot(vHalfNormal, bitangent),
                dot(vHalfNormal, normal));

    vTextureCoord = aTextureCoord;
    gl_Position =  uProjection * transformedPosition;
}
