"use strict";

/* Pool of connected presentation instances */
var clients = [];

/* Cached presentation state */
var cached = null;

/* Simply broadcast every incoming message that contains actual data to the other clients. If
   the incoming data is null, reply with the saved status */
self.onconnect = function(evt){
	var port = evt.ports[0];
	clients.push(port);
	port.onmessage = function(evt){
		if(evt.data !== null){
			cached = evt.data;
			for(var i = 0, l = clients.length; i < l; i++){
				if(clients[i] && clients[i] !== port){
					clients[i].postMessage(evt.data);
				}
			}
		}
		else {
			port.postMessage(cached);
		}
	};

};
