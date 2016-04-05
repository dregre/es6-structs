/*!
* structs-polyfill: WeakMap, Map, WeakSet, and Set for older browsers.
* Copyright 2015 Andre Gregori
* Licensed under MIT (https://github.com/dregre/structs-polyfill/blob/master/license.txt)
*/
// (function(window){

var uidCount = 0;

function uid(what: any): string{
    if(!!what && typeof what === 'object') {
        if (typeof what['__structs_uid__'] !== 'string'){
            var uid = 'o' + uidCount++;
            try {
                Object.defineProperty(what, '__structs_uid__', {
                    value: uid,
                    enumerable: false,
                    writable: false,
                    configurable: false
                });
            } catch (e) {
                // We've encountered an error -- probably because we're in a
                // browser that doesn't support Object.defineProperty.  In
                // this case, we'll add the property to the object directly,
                // which, however, is avowedly not very desirable since
                // the property thus becomes enumerable.
                what['__structs_uid__'] = uid;
            }
        }
        return what['__structs_uid__'];
    }
    return 's' + what;
}

interface Datum<K, V> {
    entry: [K, V];
    order: number;
}

class Iterator<T, K, V> {
    private _count: number;
    private _getValue: (entry: [K, V]) => T;
    private _data: Datum<K, V>[];

    constructor (data, getValue) {
        this._count = 0;
        this._data = data;
        this._getValue = getValue;
    }

    next () {
        return {
            'done': this._count >= this._data.length,
            'value': this._data[this._count] && this._getValue(this._data[this._count++].entry)
        }
    }
}

class BaseMap<K, V> {
    private _lengthDecrementCallbacks: Array<()=>void>;
    private _lengthIncrementCallbacks: Array<()=>void>;
    protected _data: { [key: string]: Datum<K, V> };
    private _insertionCount: number;
    length: number;

    constructor(iterable?: [K, V][]) {
        this._data = {};
        this._insertionCount = 0;
        this.length = 0;
        this._lengthDecrementCallbacks = [];
        this._lengthIncrementCallbacks = [];

        if(iterable) {
            for(var i = 0; i < iterable.length; i++) {
                this.set(iterable[i][0], iterable[i][1])
            }
        }
    }

    set (key: K, value: V): BaseMap<K,V> {
        var hadKey = this.has(key);
        this._data[uid(key)] = { entry: this._setInternal(key, value), order: this._insertionCount++ };
        if(!hadKey) {
            this._incrementLength();
        }
        return this;
    }

    get (key: K): V {
        if(this.has(key)){
            return this._data[uid(key)].entry[1];
        }
    }

    delete (key: K): boolean {
        var hasKey = this.has(key);
        if(hasKey){
            this._data[uid(key)] = undefined;
            this._decrementLength();
            return true;
        }
        return false;
    }

    has (key: K) {
        return !!this._data[uid(key)];
    }

    private _decrementLength(): void {
        this.length--;
        for(var i = 0; i < this._lengthDecrementCallbacks.length; i++){
            this._lengthDecrementCallbacks[i]();
        }
    }

    private _incrementLength(): void {
        this.length++;
        for(var i = 0; i < this._lengthIncrementCallbacks.length; i++){
            this._lengthIncrementCallbacks[i]();
        }
    }

    protected _setInternal (key: K, value: V): [K, V] {
        return [,value];
    }

    onLengthDecrement (callback: () => void){
        this._lengthDecrementCallbacks.push(callback);
    }

    onLengthIncrement (callback: () => void){
        this._lengthIncrementCallbacks.push(callback);
    }
}

class WeakMap<K extends Object, V> extends BaseMap<K, V> {
    set (key: K, value: V): WeakMap<K, V> {
        if(typeof key !== 'object') {
            throw TypeError('Invalid value used as weak map key');
        }
        super.set(key, value);
        return this;
    }
}

class Map<K, V> extends BaseMap<K, V> {
    private _resetLengthCallbacks: Array<()=>void>;

    constructor(iterable?: [K, V][]) {
        super(iterable);
        this._resetLengthCallbacks = [];
    };

    protected _setInternal (key: K, value: V): [K, V] {
        return [key, value];
    }

    /**
     * Returns array of data sorted by insertion order.
     */
    private _listData(): Datum<K, V>[] {
        var result = [];
        for (var property in this._data) {
            if (this._data.hasOwnProperty(property)) {
                var datum = this._data[property];
                if (datum) {
                    result.push(datum);
                }
            }
        }
        return result.sort((a,b) => a.order > b.order ? 1 : -1);
    }

    /**
     * Iterates through the entries by insertion order and calls callback.
     */
    private _forEachEntry (callback: (entry: [K, V]) => void) {
        var entries = this._listData();
        for (var i = 0; i < entries.length; i++) {
            callback(entries[i].entry);
        }
    }

    forEach (callback: (v?: V, k?: K, map?: Map<K, V>) => void, thisArg?: any){
        thisArg = thisArg || this;
        this._forEachEntry((entry: [K, V]) => {
            callback.call(thisArg, entry[1], entry[0], this);
        });
    }

    clear (): void {
        this._data = {};
        this._resetLength();
    }

    entries (): Iterator<[K, V], K, V> {
        return new Iterator<[K, V], K, V>(this._listData(), entry => entry);
    }

    keys (): Iterator<K, K, V> {
        return new Iterator<K, K, V>(this._listData(), entry => entry[0]);
    }

    values (): Iterator<V, K, V> {
        return new Iterator<V, K, V>(this._listData(), entry => entry[1]);
    }

    onResetLength (callback: () => void ){
        this._resetLengthCallbacks.push(callback);
    }

    private _resetLength (): void {
        this.length = 0;
        for(var i = 0; i < this._resetLengthCallbacks.length; i++){
            this._resetLengthCallbacks[i]();
        }
    }
}

class BaseSet<T, M extends WeakMap<any, any>> {
    protected _data: M;
    length: number;
    size: number;

    constructor (values?: T[]) {
        this.size = 0;
        this.length = 0;
        this._data = this._initData();
        this._data.onLengthDecrement(() => {
            this.length--;
            this.size--;
        });
        this._data.onLengthIncrement(() => {
            this.length++;
            this.size++;
        });

        if(values) {
            for(var i = 0; i < values.length; i++){
                this.add(values[i]);
            }
        }
    }

    protected _initData (): M {
        return;
    }

    add (value: T): BaseSet<T, M> {
        this._data.set(value, value);
        return this;
    }

    delete (value: T): boolean {
        return this._data.delete(value);
    }

    has (value: T): boolean {
        return this._data.has(value);
    }
}

class WeakSet<T extends Object> extends BaseSet<T, WeakMap<T, T>> {
    protected _initData(): WeakMap<T, T> {
        return new WeakMap<T, T>();
    }

    add (value: T): WeakSet<T> {
        if(typeof value !== 'object') {
            throw TypeError('Invalid value used in weak set');
        }
        this._data.set(value, undefined);
        return this;
    }
}

class Set<T> extends BaseSet<T, Map<T,T>> {
    constructor (values?: T[]) {
        super(values);
        this._data.onResetLength(() => {
            this.length = 0;
            this.size = 0;
        });
    }

    protected _initData (): Map<T, T> {
        return new Map<T, T>();
    }

    add (value: T): Set<T> {
        super.add(value);
        return this;
    }

    clear (): void {
        this._data.clear();
    }

    entries (): Iterator<[T, T], T, T> {
        return this._data.entries();
    }

    forEach (callback: (v?: T, k?: T, set?: Set<T>) => void, thisArg?: any){
        thisArg = thisArg || this;
        this._data.forEach((v, k) => {
            callback.call(thisArg, v, k, this);
        });
    }

    keys (): Iterator<T, T, T> {
        return this._data.keys();
    }

    values (): Iterator<T, T, T> {
        return this._data.values();
    }
}


// if(!window.WeakMap) {
//     window.WeakMap = WeakMap;
// }
// if(!window.Map) {
//     window.Map = Map;
// }
// if(!window.Set) {
//     window.Set = Set;
// }
// if(!window.WeakSet) {
//     window.WeakSet = WeakSet;
// }
// })(this);