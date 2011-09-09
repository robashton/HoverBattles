Sphere = require('./bounding').Sphere;

var Missile = 
{
    _ctor: function() {
	 	this.target = null;
		this.source = null;
		this._velocity = vec3.create([0,0,0]);	
		this.bounds = new Sphere(1.0, [0,0,0])	
	},
	setSource: function(source) {
		this.source = source;
		this.position = vec3.create(source.position);	
	},
    setTarget: function(target) {
        this.target = target;
    },
    doLogic: function() {

		this.updateVelocityTowardsTarget();
		this.performPhysics();
		this.determineIfTargetIsReached();
		
	},
	
	determineIfTargetIsReached: function() {
		var myBounds = this.bounds.translate(this.position);
		var targetSphere = this.target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
			this.raiseEvent('targetHit', { 
				targetid: this.target.getId(),
				sourceid: this.source.getId() });
		}
	},
	
	performPhysics: function() {
		vec3.add(this.position, this._velocity);
		
		if(!this.isWithinReachOfTarget())
			this.clipMissileToTerrain();
	},
	
	isWithinReachOfTarget: function() {
		var difference = this.calculateVectorToTarget();
		difference[1] = 0;
		var distanceToTargetIgnoringHeight = vec3.length(difference);
		return distanceToTargetIgnoringHeight < 2;		
	},
	
	updateVelocityTowardsTarget: function() {
		var difference = this.calculateVectorToTarget();
		this.distanceFromTarget = vec3.length(difference);
		vec3.scale(difference, 1.2 / this.distanceFromTarget, this._velocity);	
		
	},
	
	clipMissileToTerrain: function(vectorToTarget) {
		var terrain = this._scene.getEntity("terrain");
        var terrainHeight = terrain.getHeightAt(this.position[0], this.position[2]);
		this.position[1] = terrainHeight;	
		
	},
	
	calculateVectorToTarget: function() {	
	    var targetDestination = this.target.position;
	    var currentPosition = this.position;
		var difference = vec3.create([0,0,0]);
		vec3.subtract(targetDestination, currentPosition, difference);
		return difference;
	}
};

exports.Missile = Missile;