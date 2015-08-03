module structs {
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

    class WeakMap<K, V> {
        private lengthDecrementCallbacks: Array<()=>void>;
        private lengthIncrementCallbacks: Array<()=>void>;
        protected data: {};
        length: number;

        constructor(iterable?: [K, V][]) {
            this.data = {};
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
            this.data[uid(key)] = this.setInternal(key, value);
            if(!hadKey) {
                this.incrementLength();
            }
            return this;
        }

        get (key: K): V {
            if(this.has(key)){
                return this.data[uid(key)][1];
            }
        }

        delete (key: K): void {
            var hadKey = this.has(key);
            this.data[uid(key)] = undefined;
            if(hadKey){
                this.decrementLength();
            }
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

    class Map<K, V> extends WeakMap<K, V> {
        private resetLengthCallbacks: Array<()=>void>;

        constructor(iterable?: [K, V][]) {
            super(iterable);
            this.resetLengthCallbacks = [];
        };

        protected setInternal (key: K, value: V): [K, V] {
            return [key, value];
        }

        private forEachEntry (callback: (entry: [K, V]) => void) {
            for(var property in this.data) {
                if(this.data.hasOwnProperty(property)){
                    var entry = this.data[property];
                    if(entry) {
                        callback(entry);
                    }
                }
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

        entries (): [K, V][] {
            var entries: [K,V][] = [];
            this.forEachEntry((entry: [K, V]) => {
                entries.push(entry);
            });
            return entries;
        }

        keys (): K[] {
            var keys: K[] = [];
            this.forEachEntry((entry: [K, V]) => {
                keys.push(entry[0]);
            });
            return keys;
        }

        values (): V[] {
            var values: V[] = [];
            this.forEachEntry((entry: [K, V]) => {
                values.push(entry[1]);
            });
            return values;
        }

        onResetLength (callback: () => void){
            this.resetLengthCallbacks.push(callback);
        }

        private resetLength (): void {
            this.length = 0;
            for(var i = 0; i < this.resetLengthCallbacks.length; i++){
                this.resetLengthCallbacks[i]();
            }
        }
    }

    class Set<T> {
        private data: Map<T, T>;
        length: number;
        size: number;

        constructor(values?: T[]){
            this.size = 0;
            this.length = 0;
            this.data = new Map<T, T>();
            this.data.onLengthDecrement(() => {
                this.length--;
                this.size--;
            });
            this.data.onLengthIncrement(() => {
                this.length++;
                this.size++;
            });
            this.data.onResetLength(() => {
                this.length = 0;
                this.size = 0;
            });

            if(values) {
                for(var i = 0; i < values.length; i++){
                    this.add(values[i]);
                }
            }
        }

        add (value: T): Set<T> {
            this.data.set(value, value);
            return this;
        }

        clear (): void {
            this.data.clear();
        }

        delete (value: T): void {
            this.data.delete(value);
        }

        entries (): [T, T][] {
            return this.data.entries();
        }


        forEach (callback: (v?: T, k?: T, set?: Set<T>) => void, thisArg?: any){
            thisArg = thisArg || this;
            this.data.forEach((v, k) => {
                callback.call(thisArg, v, k, this);
            });
        }

        has (value: T): boolean {
            return this.data.has(value);
        }

        keys (): T[] {
            return this.data.keys();
        }

        values (): T[] {
            return this.data.values();
        }
    }


    if(!window.WeakMap) {
        window.WeakMap = WeakMap;
    }

    if(!window.Map) {
        window.Map = Map;
    }

    if(!window.Set) {
        window.Set = Set;
    }
}