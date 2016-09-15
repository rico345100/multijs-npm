"use strict";
const STATE = { WAIT: 0, PENDING: 1, COMPLETED: 2, ERROR: 3 };
const URL = window.URL || window.webkitURL;
const Blob = window.Blob;
let BlobUrl = false;
let supportWorker = false;
let threadNumber = 0;   //ID of each thread

//Check worker is supported
if( typeof window.Worker !== 'undefined' )
	supportWorker = true;
if( !URL || !Blob )
	supportWorker = false;

class Thread {
	constructor(fn) {
		this.id = threadNumber++;		// unique id
		this.state = STATE.WAIT;
		this._threadFunc = fn;
		this._evalCode = false;			// Code for actual executing (this will converted to each environment)
		this._worker = null;			// Worker object
	}
	isSupportWorker() {
		return supportWorker;
	}
	start() {
		if (this._worker) throw new Error('Thread already started.');

		// generate thread code
		// find specific patterns and convert them to cross-browse works

		// remove function brackets {}
		var functionCode = this._threadFunc.toString();
		functionCode = functionCode.slice(functionCode.indexOf("{") + 1, functionCode.lastIndexOf("}"));

		// grab the thread return data ( return statement )
		var postVariable = functionCode.match(/return(\s*)(.*);/, 'postMessage ');

		// check return statement is exists
		if (!postVariable || typeof postVariable[1] === 'undefined') {
			throw new Error('Thread requires return statement.');
		}

		//Check return statement is comment (\s : space selector)
		if ( /\/\/(\s*)return/.test(functionCode) || /\/\*(\s*)return/.test(functionCode) ) {
			throw new Error('Thread requires return statement.');
		}


		// get return equation ( return "postData * 2" )
		var returnEq = functionCode.match(/return(.*)(\s*);/)[1];

		// if environment supports Worker, convert code to send message back with postMessage method
		if (supportWorker) {

			functionCode = functionCode.replace(/return(\s*)(.*);/, 'postMessage(') + returnEq + ');';	// remove return statement
			functionCode = "self.addEventListener('message', function(message) { var postData = message.data;" + functionCode + " });";	// and add event handler

			// generate JavaScript file with blob and give the source into Worker
			var blob = new Blob([functionCode]);
			BlobUrl = URL.createObjectURL(blob); 
			this._worker = new Worker(BlobUrl);

			this._worker.postMessage(100);

		}
		// if not support Worker, convert code to use setTimeout instead of worker that execute code after 10 ms.
		else {

			var evalCode = 'var threadResultData = 0; setTimeout(function() { ';

			// remove return statement
			var removeReturnCode = functionCode.replace(/return(.*)(\s*);/, '');

			evalCode += removeReturnCode;
			evalCode += 'threadResultData = ' + returnEq + ';';
			evalCode += 'callback(null, threadResultData);';
			evalCode += '}, 10);';

			this._evalCode = evalCode;	// update code
			this._worker = true;

		}
		
		return this;
	}
	execute(data, cb) {
		if (!this._worker) throw new Error('Thread is not activated.');

		data = data || undefined;

		var self = this;
		this.state = STATE.PENDING;

		//If support Worker, post data to thread
		if (supportWorker) {
			this._worker.postMessage(data);
			this._worker.onmessage = function (e) {
				self.state = STATE.COMPLETED;
				cb(null, e.data);
			};
			this._worker.onerror = function (e) {
				self.state = STATE.ERROR;
				cb(e, null);
			}
		}
		//Else, let's just execute after 10 ms
		else {
			eval('var postData = ' + data + ';' + this._evalCode);	// this._evalCode has converted code that using setTimeout instead
		}
		
		return this;
	}
	terminate() {
		if(!this._worker) throw new Error('Thread is not activated');
	
		// if support Worker, revoke used URL and terminate Worker
		if(supportWorker) {
			this._worker.terminate();
			this._worker = URL.revokeObjectURL(BlobUrl);
		}
				
		this._worker = null;
		this._evalCode = false;
		
		return this;
	}
}

module.exports = Thread;