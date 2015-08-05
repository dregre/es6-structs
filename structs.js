/*!
* structs-polyfill: WeakMap, Map, WeakSet, and Set for older browsers.
* Copyright 2015 Andre Gregori
* Licensed under MIT (https://github.com/dregre/structs-polyfill/blob/master/license.txt)
*/
(function(window){
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var uidCount = 0;
function uid(what) {
    if (typeof what === 'object') {
        if (typeof what.__structs_uid__ !== 'string') {
            var uid = 'o' + uidCount++;
            try {
                Object.defineProperty(what, '__structs_uid__', {
                    value: uid,
                    enumerable: false,
                    writable: false,
                    configurable: false
                });
            }
            catch (e) {
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
var Iterator = (function () {
    function Iterator(data, getValue) {
        this._count = 0;
        this._data = data;
        this._getValue = getValue;
    }
    Iterator.prototype.next = function () {
        return {
            'done': this._count >= this._data.length,
            'value': this._data[this._count] && this._getValue(this._data[this._count++].entry)
        };
    };
    return Iterator;
})();
var BaseMap = (function () {
    function BaseMap(iterable) {
        this._data = {};
        this._insertionCount = 0;
        this.length = 0;
        this._lengthDecrementCallbacks = [];
        this._lengthIncrementCallbacks = [];
        if (iterable) {
            for (var i = 0; i < iterable.length; i++) {
                this.set(iterable[i][0], iterable[i][1]);
            }
        }
    }
    BaseMap.prototype.set = function (key, value) {
        var hadKey = this.has(key);
        this._data[uid(key)] = { entry: this._setInternal(key, value), order: this._insertionCount++ };
        if (!hadKey) {
            this._incrementLength();
        }
        return this;
    };
    BaseMap.prototype.get = function (key) {
        if (this.has(key)) {
            return this._data[uid(key)].entry[1];
        }
    };
    BaseMap.prototype.delete = function (key) {
        var hasKey = this.has(key);
        if (hasKey) {
            this._data[uid(key)] = undefined;
            this._decrementLength();
            return true;
        }
        return false;
    };
    BaseMap.prototype.has = function (key) {
        return !!this._data[uid(key)];
    };
    BaseMap.prototype._decrementLength = function () {
        this.length--;
        for (var i = 0; i < this._lengthDecrementCallbacks.length; i++) {
            this._lengthDecrementCallbacks[i]();
        }
    };
    BaseMap.prototype._incrementLength = function () {
        this.length++;
        for (var i = 0; i < this._lengthIncrementCallbacks.length; i++) {
            this._lengthIncrementCallbacks[i]();
        }
    };
    BaseMap.prototype._setInternal = function (key, value) {
        return [, value];
    };
    BaseMap.prototype.onLengthDecrement = function (callback) {
        this._lengthDecrementCallbacks.push(callback);
    };
    BaseMap.prototype.onLengthIncrement = function (callback) {
        this._lengthIncrementCallbacks.push(callback);
    };
    return BaseMap;
})();
var WeakMap = (function (_super) {
    __extends(WeakMap, _super);
    function WeakMap() {
        _super.apply(this, arguments);
    }
    WeakMap.prototype.set = function (key, value) {
        if (typeof key !== 'object') {
            throw TypeError('Invalid value used as weak map key');
        }
        _super.prototype.set.call(this, key, value);
        return this;
    };
    return WeakMap;
})(BaseMap);
var Map = (function (_super) {
    __extends(Map, _super);
    function Map(iterable) {
        _super.call(this, iterable);
        this._resetLengthCallbacks = [];
    }
    ;
    Map.prototype._setInternal = function (key, value) {
        return [key, value];
    };
    /**
     * Returns array of data sorted by insertion order.
     */
    Map.prototype._listData = function () {
        var result = [];
        for (var property in this._data) {
            if (this._data.hasOwnProperty(property)) {
                var datum = this._data[property];
                if (datum) {
                    result.push(datum);
                }
            }
        }
        return result.sort(function (a, b) { return a.order > b.order ? 1 : -1; });
    };
    /**
     * Iterates through the entries by insertion order and calls callback.
     */
    Map.prototype._forEachEntry = function (callback) {
        var entries = this._listData();
        for (var i = 0; i < entries.length; i++) {
            callback(entries[i].entry);
        }
    };
    Map.prototype.forEach = function (callback, thisArg) {
        var _this = this;
        thisArg = thisArg || this;
        this._forEachEntry(function (entry) {
            callback.call(thisArg, entry[0], entry[1], _this);
        });
    };
    Map.prototype.clear = function () {
        this._data = {};
        this._resetLength();
    };
    Map.prototype.entries = function () {
        return new Iterator(this._listData(), function (entry) { return entry; });
    };
    Map.prototype.keys = function () {
        return new Iterator(this._listData(), function (entry) { return entry[0]; });
    };
    Map.prototype.values = function () {
        return new Iterator(this._listData(), function (entry) { return entry[1]; });
    };
    Map.prototype.onResetLength = function (callback) {
        this._resetLengthCallbacks.push(callback);
    };
    Map.prototype._resetLength = function () {
        this.length = 0;
        for (var i = 0; i < this._resetLengthCallbacks.length; i++) {
            this._resetLengthCallbacks[i]();
        }
    };
    return Map;
})(BaseMap);
var BaseSet = (function () {
    function BaseSet(values) {
        var _this = this;
        this.size = 0;
        this.length = 0;
        this._data = this._initData();
        this._data.onLengthDecrement(function () {
            _this.length--;
            _this.size--;
        });
        this._data.onLengthIncrement(function () {
            _this.length++;
            _this.size++;
        });
        if (values) {
            for (var i = 0; i < values.length; i++) {
                this.add(values[i]);
            }
        }
    }
    BaseSet.prototype._initData = function () {
        return;
    };
    BaseSet.prototype.add = function (value) {
        this._data.set(value, value);
        return this;
    };
    BaseSet.prototype.delete = function (value) {
        return this._data.delete(value);
    };
    BaseSet.prototype.has = function (value) {
        return this._data.has(value);
    };
    return BaseSet;
})();
var WeakSet = (function (_super) {
    __extends(WeakSet, _super);
    function WeakSet() {
        _super.apply(this, arguments);
    }
    WeakSet.prototype._initData = function () {
        return new WeakMap();
    };
    WeakSet.prototype.add = function (value) {
        if (typeof value !== 'object') {
            throw TypeError('Invalid value used in weak set');
        }
        this._data.set(value, undefined);
        return this;
    };
    return WeakSet;
})(BaseSet);
var Set = (function (_super) {
    __extends(Set, _super);
    function Set(values) {
        var _this = this;
        _super.call(this, values);
        this._data.onResetLength(function () {
            _this.length = 0;
            _this.size = 0;
        });
    }
    Set.prototype._initData = function () {
        return new Map();
    };
    Set.prototype.add = function (value) {
        _super.prototype.add.call(this, value);
        return this;
    };
    Set.prototype.clear = function () {
        this._data.clear();
    };
    Set.prototype.entries = function () {
        return this._data.entries();
    };
    Set.prototype.forEach = function (callback, thisArg) {
        var _this = this;
        thisArg = thisArg || this;
        this._data.forEach(function (v, k) {
            callback.call(thisArg, v, k, _this);
        });
    };
    Set.prototype.keys = function () {
        return this._data.keys();
    };
    Set.prototype.values = function () {
        return this._data.values();
    };
    return Set;
})(BaseSet);
if(!window.WeakMap) {
    window.WeakMap = WeakMap;
}
if(!window.Map) {
    window.Map = Map;
}
if(!window.Set) {
    window.Set = Set;
}

})(this); 