/*
   Copyright 2014 Neo Neo

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function (global) {

	var PENDING = 0, FULFILLED = 1, REJECTED = 2,
		states = ["PENDING", "FULFILLED", "REJECTED"];

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

		var state = PENDING,
			subscribers = [],
			result,
			catchExceptions = true;

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

		this.done = function (onFulfilled, onRejected) {
			if (typeof onRejected !== "function") {
				onRejected = function (reason) {
					throw reason;
				};
			}
			catchExceptions = false;
			return this.then(onFulfilled, onRejected);
		}

		this.isPending = function () {
			return state === PENDING;
		}
		this.isFulfilled = function () {
			return state === FULFILLED;
		}
		this.isRejected = function () {
			return state === REJECTED;
		}
		this.status = function () {
			var info = {
				state: state,
				stateText: states[state]
			};
			if (this.isFulfilled()) {
				info.value = result;
			} else if (this.isRejected()) {
				info.reason = result;
			}

			return info;
		}

		function fulfill(value) {
			if (state === PENDING) {
				state = FULFILLED;
				result = value;
				notify();
			}
		};

		function reject(reason) {
			if (state === PENDING) {
				state = REJECTED;
				result = reason;
				notify();
			}
		};

		function notify() {
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
							if (!catchExceptions) {
								throw e;
							}
						}

					}
				});
				subscribers = [];
			}, 0);
		};

		observe(fulfill, reject);

	};

	global.Signal = {
		resolver: function () {
			return new Resolver();
		},
		fulfilled: function (value) {
			var resolver = new Resolver();
			resolver.fulfill(value);
			return resolver.promise();
		},
		rejected: function (reason) {
			var resolver = new Resolver();
			resolver.reject(reason);
			return resolver.promise();
		}
	};
})(this);