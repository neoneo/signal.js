signal.js
=========

I built these scripts to further my understanding of the promise pattern.

Promise.js
----------
As far as I know, Promise.js conforms to the Promises/A+ spec, but I haven't got round to running their test cases.

Usage:

    <script src="promise.js"></script>
  	<script>
      var promise = (function () {
        // keep the resolver private, it decides when the promise is fullfilled or rejected
        var resolver = new Resolver();
        // in this example we'll trivially fullfill the promise immediately
        resolver.fulfill("OK");
        return resolver.promise();
      })();
			
			promise.then(function (value) {
				console.log(value);
				return value;
			});
		</script>


Signal.js
---------
Signals are related to promises. The main difference is that a Signal will keep calling the listener whereas a Promise will call the listener just once.

It is still work (and thought) in progress, but the idea is interesting IMO.

Usage:

    <script src="signal.js"></script>
    <script>
    // create a signal that emits the string "beat" every second
  	var beat = (function () {
      // keep the emitter private
			var emitter = new Emitter();
			interval = setInterval(function () {
				console.log("beat");
				emitter.emit("beat");
			}, 1000);
      // return the signal to the caller
			return emitter.signal();
		})();

    // we can turn the signal into another signal with fold, filter and map
    // in this example we start counting the beats
		var count = beat.fold(0, function (current, value) {
			return current + 1;
		});

    // map, filter and fold can be chained
    // pass a listener function to the listen method to receive the events 
		count.filter(function (value) {
      // emit only even numbers
			return value % 2 == 0;
		}).map(function (value) {
      // emit the square of the number
			return value * value;
		}).listen(function (value) {
      // value = 4, 16, 36, 64, ...
			console.log(value);
		});
	  </script>
    
The concept becomes more interesting when you listen for DOM events and then emit. For example:

    var signal = (function () {
      var emitter = new Emitter();
      document.body.addEventListener("mousemove", function (e) {
        emitter.emit(e);
      }
      return emitter.signal();
    });
    
    position = signal.map(function (e) {
      return {x: e.clientX, y: e.clientY};
    }).listen(function(position) {
      console.log("(" + position.x + "," + position.y + ")");
    };
    
A jQuery plugin is provided in plugin.js:

    var mousemove = $("body").signal("mousemove");
    
To implement
------------
* Ability to pause, stop and resume signals
* Ability to stop listening to signals (clean them up)
* signal.silent(n): emit if signal is silent for n ms
* signal.count(n): emit if signal has emitted n times
* signal.throttle(n): emit at most every n ms
* signal.until(other): stop emitting if the other signal emits
* signal.mute(n): do not emit during n ms
* creating a signal is too verbose at the moment (the same is true for Promise objects)
