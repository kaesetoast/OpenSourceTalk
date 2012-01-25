/* The global presentation object exposes information
   about the presentation to the parent document */
var Pik6 = {
	slides: []
}

window.addEvent('domready', function(){
"use strict";

/* Assign ids for all the slides that don't already have one
   and store references to the slides in the global presentation
   object */
$$('.pik6-slide').each(function(element, index){
	if(element.getProperty('id') === null){
		element.setProperty('id', 'Pik6Slide' + index);
	}
	Pik6.slides.push(element);
});

/* Function to setup a 4:3 aspect ratio, body positions, font
   and slide size */
var setFontFrameSizePosition = function(){
	var size      = $$('body').getSize(),
	    ratio     = 4 / 3,
	    newwidth  = (size[0].x > size[0].y * ratio) ? size[0].y * ratio : size[0].x,
	    newheight = (size[0].x > size[0].y * ratio) ? size[0].y         : size[0].x / ratio,
	    topmargin = Math.floor((size[0].y - newheight) / 2),
	    fontsize = (newheight + newwidth) / 6;
	$('Pik6-presentation-container').setStyles({
		'width'  : newwidth + 'px',
		'height' : newheight + 'px',
		'font-size'  : fontsize + '%',
		'top' : topmargin + 'px'
	});
}

/* Resize and reposition on load and on resize and load */
window.addEvent('load', setFontFrameSizePosition);
window.addEvent('resize', setFontFrameSizePosition);

/* If there's a browse link in the presentation, keep the title up to date */
$$('#Pik6-browse').addEvent('click', function(){
	window.parent.$$('title').set('text', 'Browse presentations');
});

});

/* Catch keydown events and delegate them to the parent frame */
document.addEvent('keydown', function(evt){
	/* Do not delegate if an input element is in focus */
	if(['input', 'textarea'].indexOf(document.activeElement.tagName.toLowerCase()) !== -1){
		return;
	}
	var code   = evt.event.keyCode,
	    parent = window.parent;
	if(code == 39 || code == 34){
		parent.fireEvent('slidenext');
	}
	else if(code == 37 || code == 33){
		parent.fireEvent('slideback');
	}
	else if(code == 116 || code == 190 || code == 27){
		parent.fireEvent('togglehide');
		evt.preventDefault();
	}
});
