### Polyfill for WeakMap, Map, WeakSet, and Set

The ES6 standard includes four new very useful data structures:  [WeakMap](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakMap), [Map](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Map), [WeakSet](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/WeakSet), and [Set](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Set).  Some more recent browsers have this functionality already; but until all do, you can use this polyfill.

Written in TypeScript (`structs.ts`), compiled to plain old JavaScript (ES3) (`structs.js`), and minified for your convenience (`structs.min.js`).

License: [MIT](https://tldrlegal.com/license/mit-license)

__Note:__ Objects are mutated when added to these data structures; a new property is added, `__structs_uid__`, constituting a unique id.  On browsers supporting Object.defineProperty, the property is added such that it is non-enumerable -- that is, such that it doesn't occur in a `for ... in` loop.  However, where this is not supported (such as <IE8), the property is enumerable.
