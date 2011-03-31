attribute vec3 aVertexPosition;
attribute vec4 aVertexColour;
attribute vec2 aTextureCoords;

uniform mat4 uProjection;
uniform mat4 uView;
uniform mat4 uWorld;
uniform vec3 uPlayerPosition;

varying vec4 vColour;
varying vec2 vTextureCoords;
varying float distanceFromPlayer;

void main(void){

    vec4 vertexPosition = uWorld * vec4(aVertexPosition, 1.0);
    vec4 vectorToPlayer = vec4(uPlayerPosition, 1.0) - vertexPosition;

    vec4 directionToPlayer = normalize(vectorToPlayer);

    distanceFromPlayer = dot(vectorToPlayer, vectorToPlayer);

  //  float effect = clamp(1.0 - magSquared, 0.0, 1.0);

    //vertexPosition -= directionToPlayer * effect;

	gl_Position =  uProjection * uView * vertexPosition;  

	vColour = aVertexColour;
	vTextureCoords = aTextureCoords;
}
