/* Contains the init function, get/setCurrent and workerInitalized */
var Pik6 = {
	workerInitalized : false
};

(function(){
"use strict";

var iframes, numSlides;

/* Create the web worker for synchronisation */
var worker, postMessage, handleMessage = null, synced = false;
if(typeof SharedWorker === 'function'){
	worker = new SharedWorker('lib/worker.js', 'Pik6');
}

/* Performs a worker supportet init, meaning asking the worker for a status before setting one */
var workerInit = function(){
	postMessage(true);
};

/* Ends a successful worker init */
var clearWorkerInit = function(){
	Pik6.workerInitalized = true;
	initalUpdates(Pik6.getCurrent(), false);
}

/* Process incoming worker messages */
var handleMessage = (function(){
	return (!worker) ? null : function(evt){
		/* Set the status according to the message recieved */
		if(evt.data && typeof evt.data.hash !== 'undefined' && evt.data.hash !== Pik6.getCurrent()){
			Pik6.setCurrent(evt.data.hash, false);
		}
		if(evt.data && typeof evt.data.file !== 'undefined' &&
		evt.data.file !== iframes[0].contentWindow.location.href.split('#')[0]){
			iframes.each(function(iframe){
				iframe.contentWindow.location.href = evt.data.file;
			});
		}
		/* Is there a worker init to be cleared? */
		if(!Pik6.workerInitalized){
			clearWorkerInit();
		}
	}
})();
if(worker) worker.port.onmessage = handleMessage;

/* Function to post the current state to the worker or, if
   requestOnly is true, request state from the worker */
var postMessage = (function(){
	return (!worker) ? null : function(requestOnly){
		var message = (requestOnly) ? null : {
			'file': iframes[0].contentWindow.location.href.split('#')[0],
			'hash': getHash()
		};
		return worker.port.postMessage(message);
	}
})();

/* Return the current hash */
var getHash = function(){
	return (location.hash) ? (location.hash.indexOf('#') == 0) ? location.hash.substr(1) : location.hash : 0;
}

/* Get current slide from the window's hash or, if that fails
   from the function's cache */
Pik6.getCurrent = (function(){
	var cached = 0;
	return function(){
		var hash = parseInt(getHash()); /* Returns NaN for "hidden" and the inital undefined */
		if(isNaN(hash)){
			return cached;
		}
		else {
			cached = hash;
			return hash;
		}
	};
})();

/* Change the current slide by setting the window's hash to x.
   Notify the worker if propagate is truthy */
Pik6.setCurrent = function(x, propagate){
	location.hash = x;
	if(worker && propagate){
		postMessage();
	}
}

/* The slide functions are nothing but shortcuts for triggering
   hash canges via setCurrent */
var slideTo   = function(to){
	if(to < numSlides && to > -1){
		fireEvents(to, Pik6.getCurrent());
		Pik6.setCurrent(to, true);
	}
};
var slideNext = function(){ slideTo(Pik6.getCurrent() + 1) };
var slideBack = function(){ slideTo(Pik6.getCurrent() - 1) };

/* Toggle the hidden status by switching the hash between the last
   known slide (getCurrent) or 'hide' */
var toggleHide = function(){
	var hash = (location.hash.indexOf('#') == 0 ? location.hash.substr(1) : location.hash);
	Pik6.setCurrent((hash === 'hide') ? Pik6.getCurrent() : 'hide', true);
};

/* Catch custom triggers für the slide and hide functions. These may be called from inside the iframes */
window.addEvents({
	'slideto'    : function(x){ slideTo(x); },
	'slidenext'  : slideNext,
	'slideback'  : slideBack,
	'togglehide' : toggleHide
});

/* Catch keydown events für the slide and hide functions */
document.addEvent('keydown', function(evt){
	var code = evt.event.keyCode;
	if(code === 39 || code === 34){
		slideNext();
	}
	else if(code === 37 || code === 33){
		slideBack();
	}
	else if(code === 116 || code === 190 || code === 27){
		toggleHide();
		evt.preventDefault();
	}
});

/* Apply a slide change to the iframes. Offset the iframes slide index
   by their index to make the presenter preview frame work */
var updateIframes = function(){
	var to = Pik6.getCurrent();
	iframes.each(function(element, index){
		if(iframes[0].contentWindow.Pik6){
			var win        = element.contentWindow,
				slideIndex = to + index,
				slide      = win.Pik6.slides[slideIndex];
			/* "slide" may be undefined if a presentation with only one slide is opened in the presenter
			   view. Do nothing in this case. */
			if(typeof slide !== 'undefined'){
				win.location.hash = slide.get('id');
			}
		}
	});
};

/* Fire the activate, deactivate and change events in the iframes and the frame. The function's arguments
   are the indices of the affected slides or null if no slide is affected */
var fireEvents = function(activate, deactivate){
	window.fireEvent('change', [activate, deactivate]);
	/* Fire events in iframes only for the main presentation */
	if(window.location.href.split('#')[0].substr(-10) === 'frame.html'){
		iframes.each(function(element, index){
			if(activate !== null && typeof element.contentWindow.Pik6.slides[activate] !== 'undefined'){
				element.contentWindow.Pik6.slides[activate].fireEvent('activate');
			}
			if(deactivate !== null && typeof element.contentWindow.Pik6.slides[deactivate] !== 'undefined'){
				element.contentWindow.Pik6.slides[deactivate].fireEvent('deactivate');
			}
			element.contentWindow.document.fireEvent('change', [activate, deactivate]);
		});
	}
};

/* Watch the window for hash changes, delegate the changes to the iframes and the other windows */
window.addEvent('hashchange', function(hash){
	if(hash === 'hide'){
		iframes.each(function(element, index){
			element.contentWindow.location.hash = 'hide';
		});
	}
	else if(hash !== ''){
		updateIframes();
		updateUi();
	}
	Pik6.setCurrent(Pik6.getCurrent(), true);
});

/* Update the main UI elements */
var updateUi = function(){
	$('Pik6-framecontrols-slidecount').set('html', 1 + Pik6.getCurrent() + ' / ' + numSlides);
}

/* Stuff that needs to happen when everything is initalized */
var initalUpdates = function(){
	updateIframes();
	fireEvents(Pik6.getCurrent(), null);
	updateUi(Pik6.getCurrent(), numSlides);
	location.hash = Pik6.getCurrent();
}

/* Setup the iframes after a change or the inital loading. This needs to be called as soon
   as all iframes containing presenations have loaded */
Pik6.init = function(){
	iframes = arguments[0];

	/* The first iframe is responsible for the presentation's title and the slide count */
	var firstIframe = iframes[0];
	if(firstIframe.contentWindow.Pik6){
		$$('title').set('text', firstIframe.contentWindow.document.getElements('title').get('text'));
		numSlides = firstIframe.contentWindow.Pik6.slides.length;

		/* Take care that all the other iframes are on the same page */
		var firstHref = firstIframe.contentWindow.location.href.split('#')[0];
		iframes.each(function(iframe){
			var thisHref = iframe.contentWindow.location.href.split('#')[0];
			if(iframe !== firstIframe && thisHref !== firstHref){
				iframe.contentWindow.location.href = firstHref;
			}
		});

		/* Perform the worker init or just trigger inital updates without involving the worker */
		if(worker && !Pik6.workerInitalized){
			workerInit();
		}
		else {
			initalUpdates();
			Pik6.setCurrent(Pik6.getCurrent(), true);
		}

		/* Fire an event to allow specialized scripts to react on init */
		window.fireEvent('init');

	}

}

/* One-time-init stuff */
window.addEvent('domready', function(){

	/* Setup the "open presentation" dialog */
	$('Pik6-open-presentation').addEvent('click', function(){
		var current = iframes[0].contentWindow.location.href;
		var url = window.prompt('Enter presentation URL to open', current);
		if(url){
			Pik6.setCurrent(0, true);
			iframes.each(function(iframe){
				iframe.contentWindow.location.href = url;
			});
		}
	});

	/* Reload the current presentation */
	$('Pik6-reload-presentation').addEvent('click', function(){
		iframes.each(function(iframe){
			iframe.contentWindow.location.reload(true);
		});
	});

	/* Browse for more presentations */
	$('Pik6-browse').addEvent('click', function(evt){
		evt.preventDefault();
		Pik6.setCurrent(0, true);
		iframes[0].contentWindow.location.href = this.get('href');
		$$('title').set('text', 'Browse presentations');
	});

});

})();
