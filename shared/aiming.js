var vec3 = require('./glmatrix').vec3;
var mat4 = require('./glmatrix').mat4;
var Frustum = require('./frustum').Frustum;

var Aiming = {
    aimingFrustum: new Frustum(mat4.perspective(30, 4/3, 1.0, 250.0)),
    doLogic: function() {
        
        this.recomposeFrustum();
        this.determineTarget();
    }, 
    recomposeFrustum: function(){
        
        var lookAt = [0,0,1,0];
        var lookAtTransform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
        mat4.rotateY(lookAtTransform, -this.rotationY);
        mat4.multiplyVec4(lookAtTransform, lookAt);
        
        vec3.add(lookAt, this.position);
        
        var transform = mat4.lookAt(this.position, lookAt, [0,1,0]);
  //      var invertPosition = vec3.create(this.position);
  //     vec3.negate(invertPosition);
  //      mat4.translate(transform, invertPosition);
      
        this.aimingFrustum.setTransform(transform);
    },
    determineTarget: function(){
             
        for(var i in this._scene._entities){
            var entity = this._scene._entities[i];
            if(entity === this) continue;
            if(!entity.getSphere) continue;
            
            
            // Get a vector to the other entity
            var vectorToOtherEntity = vec3.create([0,0,0]);
            vec3.subtract(entity.position, this.position, vectorToOtherEntity);
            var distanceToOtherEntity = vec3.length(vectorToOtherEntity);
            
            vec3.scale(vectorToOtherEntity, 1 / distanceToOtherEntity);
            
            // Get the direction we're aiming in
            var vectorOfAim = [0,0,-1,1];
            var lookAtTransform = mat4.create([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0]);
            mat4.identity(lookAtTransform);
            mat4.rotateY(lookAtTransform, this.rotationY);
            mat4.multiplyVec4(lookAtTransform, vectorOfAim);
            
            // We must both be within a certain angle of the other entity
            // and within a certain distance
            var quotient = vec3.dot(vectorOfAim, vectorToOtherEntity);            
            if(quotient > 0.75 && distanceToOtherEntity < 128) 
            {
                if(this.player) {
                    debug['Aimed at'] = '' + i;
                }
            }
            else  
            {
                if(this.player) {
                    debug['Aimed at'] = '' + ' with ' + quotient;
                }
            }
        }   
    }
};

exports.Aiming = Aiming;