Missile = 
{
    target: null,    
    setTarget: function(target) {
        this.target = target;    
    },
    doLogic: function() {
        
    }, 
    notifyLockLost: function() {
     this.target = null;   
    }
};

exports.Missile = Missile;