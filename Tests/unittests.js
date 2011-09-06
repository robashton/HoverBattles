// These are more sensible unit level tests around various pieces of entity logic

$(document).ready(function() {

	LazyLoad.js('/Build', function(){
	
    	$app(function(){
	
			module("Basic entity tests");
			
			test("When raising an event", function(){
				var entity = new Entity();
				var TestListener = function() { 
					this.called = false; 
					}
				TestListener.prototype.handler = function(data) {
					 this.called = true;
					this.data = data;

					}
				var listener = new TestListener();
				var data = {};
				
				entity.addEventHandler('_testEvent', function(data) { listener.handler(data); listener.context = this; });				
				entity.raiseEvent('_testEvent', data);
				
				ok(listener.called, "Callback was made to provided handler");
				ok(listener.context === entity, "Callback was made in context of entity");
				ok(listener.data === data, "Callback was given the provided data");
			});
	
	
    		module("Targetting Entity Tests");

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
				ok(entity.getCurrentTarget() === newTarget, "The selected target is the oldest target available");
				ok(entity.shouldHaveRaisedEvent('cancelledTrackingTarget', { target: oldTarget }), "Event was raised to let listeners know old target has disappeared");
				ok(entity.shouldHaveRaisedEvent('trackingTarget', { target: newTarget }), "Event was raised to let listeners know of new target");
			});
			
			test("When the tracking component has a number of targetted entities", function(){
				var targetOne = new HovercraftEntityBuilder()
										.WithId('one');
				var targetTwo = new HovercraftEntityBuilder()
										.WithId('two');
				var targetThree = new HovercraftEntityBuilder()
									.WithId('three');
				
				var entity = new HovercraftEntityBuilder()
									.WithTracking()
									.Get();
									
				entity.notifyAimingAt(targetOne);
				entity.notifyAimingAt(targetTwo);
				entity.notifyAimingAt(targetThree);
				
				
				var oldestTargetedEntity = entity.getOldestTrackedObject();				
				ok(oldestTargetedEntity === targetOne, "The oldest tracked object can be discovered");
				
				
			});
			
			module("Firing Controller Tests"); 
			
			asyncTest("After a target has been selected while time elapses", function() {
				var target = new HovercraftEntityBuilder()
									.WithId('target').Get();
				var controlled = new HovercraftEntityBuilder()
									.WithId('controlled').Get();
				var fakeServer = new FakeCommunication();				
				var fireController = new FiringController(controlled, fakeServer);
										
				fireController.onTrackingTarget({ target: target});
				
				setTimeout(function() {
					fireController.onTick();
					ok(fakeServer.shouldHaveReceivedMessage('fireMissile', 
								{ id: 'controlled', targetid: 'target'}), "A firing request should be sent against that target");	
					start();				
				}, 3500);		
				
			});
			
			asyncTest("If a target was selected and then unselected and time elapses", function() {
				var controlled = new HovercraftEntityBuilder()
									.WithId('controlled').Get();
				var fakeServer = new FakeCommunication();
				var fireController = new FiringController(controlled, fakeServer);

				fireController.onTrackingTarget({target: {}});
				fireController.onCancelledTrackingTarget({target: {}});
				
				setTimeout(function() {
					fireController.onTick();
					ok(!fakeServer.shouldHaveReceivedMessage('fireMissile', {}), "Firing controller should not send a firing message");
					start();
				}, 3500);			
				
			});			
  		});
	});
	
	
	var FakeCommunication = function() {
		this.sentMessages = new MessageCollection();
	};
	
	FakeCommunication.prototype.sendMessage = function(messageName, data) {
		this.sentMessages.add(messageName, data);
	};
	
	FakeCommunication.prototype.shouldHaveReceivedMessage = function(messageName, data) {
		return this.sentMessages.hasMessage(messageName, data);
	};
	
	
	var EntityTestHelperMethods = {
		_ctor: function() {
			this.raisedEvents = new MessageCollection();
		},
		raiseEvent: function(eventName, data) {
			this.raisedEvents.add(eventName, data);
		},
		shouldHaveRaisedEvent: function(eventName, expectedData) {
			return this.raisedEvents.hasMessage(eventName, expectedData);
		}
	};

	
	var HovercraftEntityBuilder = function() {
		this.entity = new Entity();
	};
	
	HovercraftEntityBuilder.prototype.WithId = function(id) {
		this.entity.getId = function() { return id; };
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
