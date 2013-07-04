var Resolver = (function () {

	var PENDING = 0, FULFILLED = 1, REJECTED = 2;

	function Resolver() {

		var promise, fulfill, reject;

		this.promise = function () {
			return promise;
		};

		this.fulfill = function (value) {
			fulfill(value);
		}

		this.reject = function (reason) {
			reject(reason);
		}

		var observe = function (onFulfilled, onRejected) {
			fulfill = onFulfilled;
			reject = onRejected;
		}

		promise = new Promise(observe);

	};

	function Promise(observe) {

		var state = PENDING;
		var subscribers = [];
		var result;
		var self = this;

		this.then = function (onFulfilled, onRejected) {
			var resolver = new Resolver();
			subscribers.push({
				resolver: resolver,
				fulfill: onFulfilled,
				reject: onRejected
			});

			if (state !== PENDING) {
				notify();
			}

			return resolver.promise();
		};

		var fulfill = function (value) {
			if (state === PENDING) {
				state = FULFILLED;
				result = value;
				notify();
			}
		};

		var reject = function (reason) {
			if (state === PENDING) {
				state = REJECTED;
				result = reason;
				notify();
			}
		};

		var notify = function () {
			setTimeout(function () {
				var callbackName = state == FULFILLED ? "fulfill" : "reject";
				subscribers.forEach(function (subscriber) {
					var callback = subscriber[callbackName];
					if (typeof callback !== "function") {
						/*
							If onFulfilled is not a function and promise1 is fulfilled, promise2 must be fulfilled with the same value.
							If onRejected is not a function and promise1 is rejected, promise2 must be rejected with the same reason.
						*/
						subscriber.resolver[callbackName](result);
					} else {
						try {
							var returnValue = callback(result);
							var type = typeof returnValue;
							if (type === "object" && returnValue !== null && typeof returnValue.then === "function") {
								/*
									If either onFulfilled or onRejected returns a promise (call it returnedPromise), promise2 must assume the state of returnedPromise:
									If returnedPromise is pending, promise2 must remain pending until returnedPromise is fulfilled or rejected.
								*/
								returnValue.then(function (value) {
									/*
										If/when returnedPromise is fulfilled, promise2 must be fulfilled with the same value.
									*/
									subscriber.resolver.fulfill(value);
								}, function (reason) {
									/*
										If/when returnedPromise is rejected, promise2 must be rejected with the same reason.
									*/
									subscriber.resolver.reject(reason);
								});
							} else {
								/*
									If either onFulfilled or onRejected returns a value that is not a promise, promise2 must be fulfilled with that value.
								*/
								subscriber.resolver.fulfill(returnValue);
							}
						} catch (e) {
							/*
								If either onFulfilled or onRejected throws an exception, promise2 must be rejected with the thrown exception as the reason.
							*/
							subscriber.resolver.reject(e);
						}

					}
				});
				subscribers = [];
			}, 0);
		};

		observe(fulfill, reject);

	};

	return Resolver;
})();