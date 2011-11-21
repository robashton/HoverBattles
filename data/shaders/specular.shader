attribute vec3 aVertexPosition;
attribute vec3 aNormal;
attribute vec2 aTextureCoord;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform mat3 uNormal;
uniform vec3 uLightPosition;

varying vec2 vTextureCoord;
varying vec3 vDirectionToLight;
varying vec3 vHalfNormal;
varying vec3 vNormal;

void main(void){
    vec3 tangent = normalize(uNormal * vec3(1,0,0));
    vec3 normal = normalize(uNormal * aNormal);
    vec3 bitangent = normalize(cross(tangent, normal));
    mat3 transform = mat3(tangent, bitangent, normal);

    vec4 transformedPosition = uView * uWorld * vec4(aVertexPosition, 1.0);
    vec3 directionToCamera =  normalize(-vec3(transformedPosition));
    vec3 directionToLight = normalize(uLightPosition - vec3(transformedPosition));

    // Transform vectors to texture space
    vDirectionToLight = directionToLight * transform;
    vHalfNormal = normalize(vDirectionToLight + (directionToCamera * transform));

    vNormal = normal * transform;
    vTextureCoord = aTextureCoord;
    gl_Position =  uProjection * transformedPosition;
}
