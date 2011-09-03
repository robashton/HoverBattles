// These are more sensible unit level tests around various pieces of entity logic

$(document).ready(function() {

	LazyLoad.js('/Build', function(){
	
    	$app(function(){
    		module("Aiming + Targeting");

			test("By default there is no selected target", function() {
				var entity = new TargetingEntityBuilder()
									.Get();
				ok(entity.hasCurrentTarget() === false, "There is no selected target");
			});
 
			test("If there is no existing target and a target is notified of", function() {
				var target = {};
				var entity = new TargetingEntityBuilder()
									.WithLatestTarget(target)
									.Get();
				
				entity._onTargetGained(target);
				
				ok(entity.hasCurrentTarget(), "There is a selected target");
				ok(entity._currentTarget === target, "The selected target is the one set");
				ok(entity.shouldHaveRaisedEvent('targetGained', { target: target }), "Event was raised to let listeners know of new target");
				
			});
			
			test("If there is an existing target and a target is notified of", function() {
				var oldTarget = {};
				var newTarget = {};
				var entity = new TargetingEntityBuilder()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(newTarget)
									.Get();
									
				entity._onTargetGained(newTarget);
				
				ok(entity.hasCurrentTarget(), "There is still a selected target");
				ok(entity._currentTarget === oldTarget, "The old target remains targetted");

			});
			
			test("If there is an existing target and the target is notified lost when there are no more targets", function(){
				var oldTarget = {};
				var entity = new TargetingEntityBuilder()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(null)
									.Get();
									
				entity._onTargetLost(oldTarget);
				
				ok(!entity.hasCurrentTarget(), "No target ends up being selected");
				
			});
			
			test("If there is an existing target and the target is notified lost and there are new targets available", function(){
				var oldTarget = {};
				var newTarget = {};
				var entity = new TargetingEntityBuilder()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(newTarget)
									.Get();
									
				entity._onTargetLost(oldTarget);
				
				ok(entity.hasCurrentTarget(), "There is a selected target");
				ok(entity._currentTarget === newTarget, "The selected target is the oldest target available");
				ok(entity.shouldHaveRaisedEvent('targetGained', { target: newTarget }), "Event was raised to let listeners know of new target");
			});
  		});3
	});
	
	var EntityTestHelperMethods = {
		_ctor: function() {
			this.raisedEvents = new Array();		
		},
		raiseEvent: function(eventName, data) {
			this.raisedEvents.push({
				eventName: eventName,
				data: data
			});
		},
		shouldHaveRaisedEvent: function(eventName, expectedData) {
			for(var x = 0 ; x < this.raisedEvents.length; x++){
				var ev = this.raisedEvents[x];
				if(ev.eventName != eventName) continue;
				for(var key in expectedData) {
					if(ev.data[key] !== expectedData[key])
					return false;
				}
				return true;
			}
			return false;
		}	
				
	};
	
	var TargetingEntityBuilder = function() {
		this.entity = new Entity();
		this.entity.attach(Targeting);
		this.entity.attach(EntityTestHelperMethods);
	};
	
	TargetingEntityBuilder.prototype.WithLatestTarget = function(target) {
		this.entity.getOldestTrackedObject = function() {
			return target;
		};
		return this;
	};
	TargetingEntityBuilder.prototype.WithCurrentTarget = function(target) {
		this.entity._currentTarget = target;
		return this;
	};
	
	TargetingEntityBuilder.prototype.Get = function() {
		return this.entity;
	};
});
