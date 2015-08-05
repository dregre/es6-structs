/*!
 * structs-polyfill: WeakMap, Map, WeakSet, and Set for older browsers.
 * Copyright 2015 Andre Gregori
 * Licensed under MIT (https://gith ub.com/twbs/bootstrap/blob/master/LICENSE)
 */
module  structs {
    var uidCount = 0;

    function uid(what: any): string{
        if(typeof what === 'object') {
            if(typeof what.__structs_uid__ !== 'string'){
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
        private count: number;
        private getValue: (entry: [K, V]) => T;
        private data: Datum<K, V>[];

        constructor (data, getValue) {
            this.count = 0;
            this.data = data;
            this.getValue = getValue;
        }

        next (arg: any) {
            return {
                done: this.count >= this.data.length,
                value: this.data[this.count] && this.getValue(this.data[this.count++]['entry'])
            }
        }
    }

    export class WeakMap<K, V> {
        private lengthDecrementCallbacks: Array<()=>void>;
        private lengthIncrementCallbacks: Array<()=>void>;
        protected data: { [key: string]: Datum<K, V> };
        private insertionCount: number;
        length: number;

        constructor(iterable?: [K, V][]) {
            this.data = {};
            this.insertionCount = 0;
            this.length = 0;
            this.lengthDecrementCallbacks = [];
            this.lengthIncrementCallbacks = [];

            if(iterable) {
                for(var i = 0; i < iterable.length; i++) {
                    this.set(iterable[i][0], iterable[i][1])
                }
            }
        }

        set (key: K, value: V): WeakMap<K,V> {
            var hadKey = this.has(key);
            this.data[uid(key)] = { entry: this.setInternal(key, value), order: this.insertionCount++ };
            if(!hadKey) {
                this.incrementLength();
            }
            return this;
        }

        get (key: K): V {
            if(this.has(key)){
                return this.data[uid(key)]['entry'][1];
            }
        }

        delete (key: K): boolean {
            var hasKey = this.has(key);
            if(hasKey){
                this.data[uid(key)] = undefined;
                this.decrementLength();
                return true;
            }
            return false;
        }

        has (key: K) {
            return !!this.data[uid(key)];
        }

        private decrementLength(): void {
            this.length--;
            for(var i = 0; i < this.lengthDecrementCallbacks.length; i++){
                this.lengthDecrementCallbacks[i]();
            }
        }

        private incrementLength(): void {
            this.length++;
            for(var i = 0; i < this.lengthIncrementCallbacks.length; i++){
                this.lengthIncrementCallbacks[i]();
            }
        }

        protected setInternal (key: K, value: V): [K, V] {
            return [,value];
        }

        onLengthDecrement (callback: () => void){
            this.lengthDecrementCallbacks.push(callback);
        }

        onLengthIncrement (callback: () => void){
            this.lengthIncrementCallbacks.push(callback);
        }
    }

    export class Map<K, V> extends WeakMap<K, V> {
        private resetLengthCallbacks: Array<()=>void>;

        constructor(iterable?: [K, V][]) {
            super(iterable);
            this.resetLengthCallbacks = [];
        };

        protected setInternal (key: K, value: V): [K, V] {
            return [key, value];
        }

        /**
         * Returns array of data sorted by insertion order.
         */
        private listData(): Datum<K, V>[] {
            var result = [];
            for (var property in this.data) {
                if (this.data.hasOwnProperty(property)) {
                    var datum = this.data[property];
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
        private forEachEntry (callback: (entry: [K, V]) => void) {
            var entries = this.listData();
            for (var i = 0; i < entries.length; i++) {
                callback(entries[i]['entry']);
            }
        }

        forEach (callback: (v?: V, k?: K, map?: Map<K, V>) => void, thisArg?: any){
            thisArg = thisArg || this;
            this.forEachEntry((entry: [K, V]) => {
                callback.call(thisArg, entry[0], entry[1], this);
            });
        }

        clear (): void {
            this.data = {};
            this.resetLength();
        }

        entries (): Iterator<[K, V], K, V> {
            return new Iterator<[K, V], K, V>(this.listData(), entry => entry);
        }

        keys (): Iterator<K, K, V> {
            return new Iterator<K, K, V>(this.listData(), entry => entry[0]);
        }

        values (): Iterator<V, K, V> {
            return new Iterator<V, K, V>(this.listData(), entry => entry[1]);
        }

        onResetLength (callback: () => void ){
            this.resetLengthCallbacks.push(callback);
        }

        private resetLength (): void {
            this.length = 0;
            for(var i = 0; i < this.resetLengthCallbacks.length; i++){
                this.resetLengthCallbacks[i]();
            }
        }
    }

    class BaseSet<T, M extends WeakMap<any, any>> {
        protected data: M;
        length: number;
        size: number;

        constructor (values?: T[]) {
            this.size = 0;
            this.length = 0;
            this.initData();
            this.data.onLengthDecrement(() => {
                this.length--;
                this.size--;
            });
            this.data.onLengthIncrement(() => {
                this.length++;
                this.size++;
            });

            if(values) {
                for(var i = 0; i < values.length; i++){
                    this.add(values[i]);
                }
            }
        }

        protected initData (): void {}

        add (value: T): BaseSet<T, M> {
            this.data.set(value, value);
            return this;
        }

        delete (value: T): boolean {
            return this.data.delete(value);
        }

        has (value: T): boolean {
            return this.data.has(value);
        }
    }

    export class WeakSet<T> extends BaseSet<T, WeakMap<T, T>> {
        protected initData (): void {
            this.data = new WeakMap<T, T>();
        }

        add (value: T): WeakSet<T> {
            super.add(value);
            return this;
        }
    }

    export class Set<T> extends BaseSet<T, Map<T,T>> {
        constructor (values?: T[]) {
            super(values);
            this.data.onResetLength(() => {
                this.length = 0;
                this.size = 0;
            });
        }

        protected initData (): void {
            this.data = new Map<T, T>();
        }

        add (value: T): Set<T> {
            super.add(value);
            return this;
        }

        clear (): void {
            this.data.clear();
        }

        entries (): Iterator<[T, T], T, T> {
            return this.data.entries();
        }

        forEach (callback: (v?: T, k?: T, set?: Set<T>) => void, thisArg?: any){
            thisArg = thisArg || this;
            this.data.forEach((v, k) => {
                callback.call(thisArg, v, k, this);
            });
        }

        keys (): Iterator<T, T, T> {
            return this.data.keys();
        }

        values (): Iterator<T, T, T> {
            return this.data.values();
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
}