# Multi.js v2.0.1
Light weight, easy to use cross browsing JavaScript multithread module.

## How does it work?
If the browser supports Web Worker and Blob, it uses Web Worker. But if not, use timer function instead.
Yes, it is not cross browsing 'multithread', but can use this module for old browsers with same code.

## Support?
IE5.5-11 and all major browsers supported.

## License?
MIT.

## Example

1. Install module via NPM
> $ npm install --save multi.js

2. Include from browser script. You need Web bundler(Browserify/Webpack) and transpiler like Babel.

```javascript
import Thread from './multi.js';

var thread = new Thread(function() {
	postData = Math.PI * postData;
	return postData;
});

thread.start().execute(100, function(err, data) {
	if(err) {
		console.log(err);
		return;
	}

	console.log(data);
	thread.terminate();
});
```

3. Build and run.