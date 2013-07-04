(function ($, signal) {

	$.fn.signal = function (events, selector, data) {
		var source = signal.source();

		this.on(events, selector, data, function (e) {
			source.emit(e);
		});

		return source.signal();
	}

})(jQuery, signal);