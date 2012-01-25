window.addEvent('domready', function(){
"use strict";

/* Timer */
(function(){
	var pad = function(x){ x = x + ''; if(x.length === 1) return '0' + x; return x; }
	var start = Date.now(), time = $('Pik6-time'), elapsed = $('Pik6-elapsed');
	setInterval(function(){
		var now = Date.now(), diff = new Date(now - start);
		time.set('html', new Date(now).toLocaleTimeString());
		elapsed.set('html', pad(diff.getHours() - 1) + ':' + pad(diff.getMinutes()) + ':' + pad(diff.getSeconds()));
	}, 1000);
})();

/* Populate slide select */
var slideselect = $('Pik6-slideselect');
window.addEvent('init', function(){
	slideselect.empty();
	var slides = $$('iframe')[0].contentWindow.Pik6.slides;
	slides.each(function(slide, index){
		var first = slide.getFirst('h1, h2, h3, h4, h5, h6, p, li');
		var option = new Element('option', {
			'text' : (first) ? index + 1 + ': ' + first.get('text') : index,
			'value': index
		});
		if(Pik6.getCurrent() === index){
			option.set('selected', 'selected'); // Pre-select the current option
		}
		option.inject(slideselect);
	});
});

/* Keep slide select up to date */
window.addEvent('change', function(activated){
	slideselect.value = activated;
});

/* Change the current slide using the slide select */
slideselect.addEvent('change', function(){
	Pik6.setCurrent(this.value, true);
});

});
