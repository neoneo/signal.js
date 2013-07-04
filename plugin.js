(function ($, Emitter) {

	$.fn.signal = function (events, selector, data) {
		var emitter = new Emitter();

		this.on(events, selector, data, function (e) {
			emitter.emit(e);
		});

		return emitter.signal();
	}

})(jQuery, Emitter);