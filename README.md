# Polyfill for WeakMap, Map, WeakSet, and Set

The EcmaScript 6 (Harmony) standard includes four new very useful data structures:  [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap), [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet), and [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).  Some more recent browsers have this functionality already; but until all do, you can use this polyfill.

As far as my research shows, this is the only polyfill for all four new data structures (including WeakSet).

Written with love in TypeScript ([structs.ts](https://github.com/dregre/structs-polyfill/blob/master/structs.ts)), compiled to plain old JavaScript (ES3) ([structs.js](https://github.com/dregre/structs-polyfill/blob/master/structs.js)), and minified for your convenience ([structs.min.js](https://github.com/dregre/structs-polyfill/blob/master/structs.min.js)).

License: [MIT](https://tldrlegal.com/license/mit-license)

## Installation

In the browser, the polyfill automatically attaches appropriate constructor functions to `window` if they are missing.  So you can just call, e.g., `new WeakMap()`.  As a true polyfill, I've attempted to replicate the exact API in the ES6.

For Node, install through npm:

```
> npm install es6-structs
```

Then in your JS:

```
var structs = require('es6-structs');
var st = new structs.Set();
var mp = new structs.Map();
var wm = new structs.WeakMap();
var ws = new structs.WeakSet();
```

## API

Please reference the official literature:

* [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap)
* [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map)
* [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet)
* [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set)).

### Notes

(1) Lookup is O(1).

(2) Objects are mutated when added to the data structures; a new property is added, `__structs_uid__`, constituting a unique id.  On browsers supporting `Object.defineProperty()`, the property is added such that it is non-enumerable -- that is, such that it doesn't occur in a `for ... in` loop.  However, where this is not supported (such as <IE8), the property is enumerable.
