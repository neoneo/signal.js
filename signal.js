var Emitter = (function () {

	function Emitter() {

		var signal, emit;

		this.signal = function () {
			return signal;
		};

		this.emit = function (value) {
			emit(value);
		}

		var observe = function (onEmit) {
			emit = onEmit;
		}

		signal = new Signal(observe);

	};

	function Signal(observe) {

		var subscribers = [];

		this.watch = function(onEmit) {
			subscribers.push(onEmit);
		}

		this.unwatch = function (onEmit) {

		}

		observe(function (value) {
			emit(value);
		});

		function emit(value) {
			subscribers.forEach(function (onEmit) {
				onEmit(value);
			});
		}

	};

	Signal.prototype = {

		map: function (f) {
			var emitter = new Emitter();

			this.watch(function (value) {
				emitter.emit(f(value));
			});

			return emitter.signal();
		},

		filter: function (f) {
			var emitter = new Emitter();

			this.watch(function (value) {
				if (f(value)) {
					emitter.emit(value);
				}
			});

			return emitter.signal();
		},

		fold: function (initial, f) {
			var emitter = new Emitter();
			var current = initial;

			this.watch(function (value) {
				current = f(current, value);
				emitter.emit(current);
			})

			return emitter.signal();
		},

		when: function (signalOrPromise, expectedValue) {
			var predicate = whenSignalOrPromise.call(this, signalOrPromise, expectedValue);
			return emitWhen.call(this, predicate).signal();
		},

		until: function (signalOrPromise, expectedValue) {
			var predicate = whenSignalOrPromise.call(this, signalOrPromise, expectedValue);
			return emitWhen.call(this, function () {
				return !predicate();
			}).signal();
		},

		mute: function (n) {
			var t = Date.now();
			return emitWhen.call(this, function () {
				return Date.now - t >= n;
			}).signal();
		},

		// emit only when at least n ms of silence have passed
		silent: function (n) {
			var t = Date.now();
			return emitWhen.call(this, function () {
				var now = Date.now();
				var emit = now - t >= n;
				t = now;
				return emit;
			}).signal();
		},

		// emit at most every n ms
		throttle: function (n) {
			var t = Date.now();
			return emitWhen.call(this, function () {
				var now = Date.now();
				var emit = now - t >= n;
				if (emit) {
					t = now;
				}
				return emit;
			}).signal();
		},

		// emit every nth emission
		every: function (n) {
			var count = 0;
			return emitWhen.call(this, function () {
				count += 1;
				return count % n == 0;
			}).signal();
		},

		accumulate: function (n) {
			return this.fold([], function (current, value) {
				current.push(value);
				if (typeof n !== "undefined" && current.length > n) {
					current.shift();
				}

				return current;
			});
		},

		then: function (onFulFilled) {
			var resolver = new Resolver();

			var self = this;
			this.watch(function watch(value) {
				resolver.fulfill(value);
				self.unwatch(watch);
			});

			return resolver.promise().then(onFulFilled);
		}

	};

	return Emitter;

	function emitWhen(predicate) {
		var emitter = new Emitter();

		var self = this;
		this.watch(function (value) {
			if (predicate(value)) {
				emitter.emit(value);
			}
		});

		return emitter; //.signal();
	}

	function whenSignalOrPromise(signalOrPromise, expectedValue) {
		var self = this;
		var result = false;
		if (signalOrPromise instanceof Signal) {
			var signal = signalOrPromise;
			signal.watch(function watch(value) {
				if (typeof expectedValue === "undefined" || value === expectedValue) {
					result = true;
					signal.unwatch(watch);
				}
			});
		} else {
			var promise = signalOrPromise;
			promise.then(function (value) {
				if (typeof expectedValue === "undefined" || value === expectedValue) {
					result = true;
				} else {
					self.unwatch(forward);
				}
			});
		}
		return function () {
			return result;
		}
	}
})();