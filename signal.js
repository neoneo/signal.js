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
		}

	};

	return Emitter;
})();