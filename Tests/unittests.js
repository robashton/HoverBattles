// These are more sensible unit level tests around various pieces of entity logic

$(document).ready(function() {

	LazyLoad.js('/Build', function(){
	
    	$app(function(){
    		module("Aiming + Targeting");

			test("By default there is no selected target", function() {
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTargeting()
									.Get();
									
				ok(entity.hasCurrentTarget() === false, "There is no selected target");
			});
 
			test("If there is no existing target and a target is notified of", function() {
				var target = {};
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTargeting()
									.WithLatestTarget(target)
									.Get();
				
				entity.onTargetGained(target);
				
				ok(entity.hasCurrentTarget(), "There is a selected target");
				ok(entity._currentTarget === target, "The selected target is the one set");
				ok(entity.shouldHaveRaisedEvent('trackingTarget', { target: target }), "Event was raised to let listeners know of new target");
				
			});
			
			test("If there is an existing target and a target is notified of", function() {
				var oldTarget = {};
				var newTarget = {};
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTargeting()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(newTarget)
									.Get();
									
				entity.onTargetGained(newTarget);
				
				ok(entity.hasCurrentTarget(), "There is still a selected target");
				ok(entity._currentTarget === oldTarget, "The old target remains targetted");

			});
			
			test("If there is an existing target and the target is notified lost when there are no more targets", function(){
				var oldTarget = {};
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTargeting()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(null)
									.Get();
									
				entity.onTargetLost(oldTarget);
				
				ok(!entity.hasCurrentTarget(), "No target ends up being selected");
				ok(entity.shouldHaveRaisedEvent('cancelledTrackingTarget', { target: oldTarget }), "Event was raised to let listeners know old target has disappeared");
				
			});
			
			test("If there is an existing target and the target is notified lost and there are new targets available", function(){
				var oldTarget = {};
				var newTarget = {};
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTargeting()
									.WithCurrentTarget(oldTarget)
									.WithLatestTarget(newTarget)
									.Get();
									
				entity.onTargetLost(oldTarget);
				
				ok(entity.hasCurrentTarget(), "There is a selected target");
				ok(entity._currentTarget === newTarget, "The selected target is the oldest target available");
				ok(entity.shouldHaveRaisedEvent('cancelledTrackingTarget', { target: oldTarget }), "Event was raised to let listeners know old target has disappeared");
				ok(entity.shouldHaveRaisedEvent('trackingTarget', { target: newTarget }), "Event was raised to let listeners know of new target");
			});
			
			module("Firing"); 
			
			asyncTest("After a target has been selected while time elapses", function() {
				var target = {};
				var entity = new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTimedFiring()						
									.Get();
				
				entity.onTrackingTarget({ target: target});
				
				setTimeout(function() {
					entity.doLogic();
					ok(entity.shouldHaveSentCommand('fireMissile', {target: target}), "A firing request should be sent against that target");	
					start();				
				}, 3500);		
				
			});
			
			asyncTest("If a target was selected and then unselected and time elapses", function() {
				var entity =  new HovercraftEntityBuilder()
									.WithTestMethods()
									.WithTimedFiring()						
									.Get();
								
				entity.onTrackingTarget({target: {}});
				entity.onCancelledTrackingTarget({target: {}});
				
				setTimeout(function() {
					entity.doLogic();
					ok(!entity.shouldHaveSentCommand('fireMissile', {}), "No firing request should be sent");
					start();
				}, 3500);			
				
			});
			
  		});
	});
	
	var EntityTestHelperMethods = {
		_ctor: function() {
			this.raisedEvents = new Array();	
			this.sentCommands = new Array();	
		},
		raiseEvent: function(eventName, data) {
			this.raisedEvents.push({
				messageName: eventName,
				data: data
			});
		},
		sendCommand: function(commandName, data) {
			this.sentCommands.push({
				messageName: commandName,
				data: data
			});
		},
		shouldHaveRaisedEvent: function(eventName, expectedData) {
			return this.hasMessageInArray(this.raisedEvents, eventName, expectedData);
		},
		shouldHaveSentCommand: function(commandName, expectedData) {
			return this.hasMessageInArray(this.sentCommands, commandName, expectedData);
		},
		hasMessageInArray: function(array, messageName, expectedData) {
			for(var x = 0 ; x < array.length; x++){
				var msg = array[x];
				if(msg.messageName != messageName) continue;
				for(var key in expectedData) {
					if(msg.data[key] !== expectedData[key])
					return false;
				}
				return true;
			}
			return false;	
		}
	};
	
	var HovercraftEntityBuilder = function() {
		this.entity = new Entity();
	};
	
	HovercraftEntityBuilder.prototype.WithTimedFiring = function() {
		this.entity.attach(TimedFiring);
		return this;
	};
	
	HovercraftEntityBuilder.prototype.WithTargeting = function() {
		this.entity.attach(Targeting);
		return this;
	};
	
	HovercraftEntityBuilder.prototype.WithTestMethods = function() {
		this.entity.attach(EntityTestHelperMethods);
		return this;	
	};
	
	HovercraftEntityBuilder.prototype.WithLatestTarget = function(target) {
		this.entity.getOldestTrackedObject = function() {
			return target;
		};
		return this;
	};
	HovercraftEntityBuilder.prototype.WithCurrentTarget = function(target) {
		this.entity._currentTarget = target;
		return this;
	};
	
	HovercraftEntityBuilder.prototype.Get = function() {
		return this.entity;
	};
});
