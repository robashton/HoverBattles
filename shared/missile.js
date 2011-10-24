Sphere = require('./bounding').Sphere;

var Missile = 
{
   _ctor: function() {
	 	this.target = null;
		this.source = null;
		this._velocity = vec3.create([0,0,0]);	
		this.bounds = new Sphere(1.0, [0,0,0]);
    this.isTrackingTarget = false;
	},
	setSource: function(sourceid, position) {
		this.sourceid = sourceid;
		this.position = vec3.create(position);	
	},
  setTarget: function(targetid) {
      if(!targetid) throw "Tried to set a null target on a missile";
      this.targetid = targetid;
      this.isTrackingTarget = true;
  },

  doLogic: function() {
   if(this.isTrackingTarget) this.updateTargetReferences();

    if(this.isTrackingTarget) {   
		  this.updateVelocityTowardsTarget();
		  this.performPhysics();
		  this.determineIfTargetIsReached();
    } else {
      
        // Probably still want to do something here in the future
        // At the moment the missile will simply cease to be
        // But simply removing the reference and letting it fly would be much cooler
    }		
	},

  updateTargetReferences: function() {
    this.source = this.getSource();
    this.target = this.getTarget();

    if(!this.source || !this.target) {
      this.isTrackingTarget = false;
			this.raiseEvent('missileLost', { 
				targetid: this.targetid,
				sourceid: this.sourceid 
      });
    }
  },

  getSource: function() {
    return this._scene.getEntity(this.sourceid);
  },

  getTarget: function() {
    return this._scene.getEntity(this.targetid);
  },
	
	determineIfTargetIsReached: function() {
		var myBounds = this.bounds.translate(this.position);
    
		var targetSphere = this.target.getSphere();
		if(targetSphere.intersectSphere(myBounds).distance < 0){
			this.raiseEvent('targetHit', { 
				targetid: this.targetid,
				sourceid: this.sourceid });
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
		vec3.scale(difference, 2.5 / this.distanceFromTarget, this._velocity);	
		
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
